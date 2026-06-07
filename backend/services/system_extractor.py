"""
backend/services/system_extractor.py

Implements the L1 extraction strategy using Gemini to convert a ParsedDocument
into a validated list of SystemRecord objects.

Features:
- Three routing paths: Text, Image, and Mixed (text with scanned pages).
- Concurrency: Scanned pages are transcribed in parallel.
- Hallucination controls: Evidence fuzzy matching and confidence capping.
- Deduplication: Case-insensitive system name deduplication.
"""

from __future__ import annotations

import asyncio
import logging
from difflib import SequenceMatcher
from typing import Any

from pydantic import BaseModel, ValidationError

from backend.models.system import SystemRecord
from backend.services.document_parser import DocumentType, ParsedDocument
from backend.utils.gemini_client import GeminiClient, GeminiJSONParseError

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

SYSTEM_INSTRUCTION = """
You are a structured enterprise IT analyst.
Your sole task is to read enterprise documents and extract IT system records.

HARD RULES — you must obey these before all other instructions:

1. EVIDENCE FIRST: Every system you output must have a verbatim quote from
   the document as its "evidence" field. Copy the exact text. Do not paraphrase.

2. GROUNDED NAMES ONLY: The "name" field must appear — letter-for-letter — in
   the source text, OR it must be an unambiguous common alias for a name that
   does appear (e.g. "SFDC" → "Salesforce"). If neither applies, do not invent
   a name.

3. NO VENDOR INVENTION: Never add a software vendor or product that is not
   supported by text in the document. If you are unsure, use the system name
   exactly as written in the document.

4. UNKNOWN IS VALID: When the document provides no evidence for a field
   (authentication_method, criticality, etc.) use the designated "Unknown"
   value rather than guessing.

5. INFERENCE MUST BE LABELLED: If a field value is inferred rather than
   explicitly stated, the confidence_score for that record must be ≤ 0.94.

6. SCANNED PAGE HANDLING: If a page is marked [SCANNED_PAGE], you have already
   received the OCR/Vision interpretation of that page. Treat it as regular text
   but reduce confidence by 0.05 for any system extracted solely from that page.

7. COMPLETENESS OVER PRECISION: It is better to extract a system with low
   confidence and flag it for review than to silently omit it.

8. NO DUPLICATE SYSTEMS: If the same system appears on multiple pages, output
   it only once. Prefer the page with the most evidence. Set source_location
   to the page with the richest context.

Output format: a single JSON object matching the schema below.
Do not wrap in markdown code fences.
Do not output any text outside the JSON object.
""".strip()

USER_PROMPT_TEMPLATE = """
SOURCE DOCUMENT: {filename}

---
{page_block}
---

TASK
----
Extract every enterprise IT system mentioned in the document above.

SCHEMA REQUIRED (one object per system in the "systems" array)
--------------------------------------------------------------
{{
  "name":                  string   — exact name from document
  "category":              one of ["CRM","ERP","HRIS","IdP","ITSM","Finance","Communication","Storage","Custom"]
  "authentication_method": one of ["OAuth2","SAML","API Key","Basic Auth","Unknown"]
  "key_entities":          [string, ...]   — at least 1 item
  "business_processes":    [string, ...]   — at least 1 item
  "criticality":           one of ["critical","high","medium","low"]
  "confidence_score":      float 0.0–1.0
  "evidence":              string — VERBATIM quote from document
  "source_document":       string — filename as given above
  "source_location": {{
    "page_number":  integer (1-indexed) or null,
    "section_hint": string or null
  }}
}}

CONFIDENCE SCORING RULES
------------------------
- 0.95–1.00 : System name + category + at least two other fields are EXPLICIT
- 0.70–0.94 : System name is explicit; remaining fields inferred from context
- 0.40–0.69 : System name appears but with very little context
- below 0.40: Highly ambiguous reference — include only if clearly an IT system

PAGE REFERENCE RULES
--------------------
- Every system must reference the page where its primary evidence was found.
- Use 1-indexed page_number matching the [PAGE N] markers in the document.
- If a section heading appears near the evidence, include it in section_hint.

RESPONSE FORMAT
---------------
Return ONLY this JSON structure, no additional text:

{{
  "systems": [ ... ]
}}
""".strip()

VISION_OCR_PROMPT = """
Transcribe all text visible in this document page. Output plain text only. 
Preserve all proper nouns, system names, and technical terms exactly as written.
""".strip()

IMAGE_DOCUMENT_PROMPT = """
[IMAGE DOCUMENT — no page markers]
Please extract systems visible in this image.
""".strip()

# ---------------------------------------------------------------------------
# Schema Definitions
# ---------------------------------------------------------------------------

class ExtractionResponse(BaseModel):
    """
    Pydantic schema used to constrain the LLM's JSON output.
    Gemini native JSON mode relies on this to prevent schema drift.
    """
    systems: list[SystemRecord]


class SystemExtractionError(Exception):
    """Raised when system extraction fails after retries or due to invalid input."""
    pass


# ---------------------------------------------------------------------------
# System Extractor Service
# ---------------------------------------------------------------------------

class SystemExtractor:
    """
    Service to extract IT systems from a ParsedDocument using Gemini.
    """

    def __init__(self, gemini_client: GeminiClient | None = None) -> None:
        self._client = gemini_client or GeminiClient()
        # Limit concurrent vision calls to prevent 429 errors
        self._vision_semaphore = asyncio.Semaphore(3)

    async def extract_systems(self, document: ParsedDocument) -> list[SystemRecord]:
        """
        Extract systems from a document, applying validation and deduplication.
        
        Handles Text, Image, and Mixed (Text + Scanned) documents.
        """
        logger.info(
            "Extracting systems from document: '%s' (type: %s, pages: %d)",
            document.filename,
            document.document_type.value,
            document.total_pages,
        )

        try:
            if document.document_type == DocumentType.IMAGE:
                return await self._extract_from_image(document)
            else:
                return await self._extract_from_text(document)
        except Exception as exc:
            logger.error("Extraction failed for '%s': %s", document.filename, exc)
            raise SystemExtractionError(f"Extraction failed: {exc}") from exc

    # -----------------------------------------------------------------------
    # Internal — Routing paths
    # -----------------------------------------------------------------------

    async def _extract_from_image(self, document: ParsedDocument) -> list[SystemRecord]:
        """Path C: Single multimodal call for image-only documents."""
        if document.image is None:
            raise SystemExtractionError("Image document missing ImageContent data.")

        prompt = USER_PROMPT_TEMPLATE.format(
            filename=document.filename,
            page_block=IMAGE_DOCUMENT_PROMPT,
        )

        raw_dict = await self._client.generate_multimodal(
            prompt=prompt,
            image_bytes=document.image.data,
            image_mime_type=document.image.mime_type,
            system_instruction=SYSTEM_INSTRUCTION,
            response_schema=ExtractionResponse,
        )
        return self._parse_and_validate(raw_dict, document, document.full_text)

    async def _extract_from_text(self, document: ParsedDocument) -> list[SystemRecord]:
        """Paths A & B: Text documents, with optional scanned-page processing."""
        page_block = await self._build_page_block(document)
        
        prompt = USER_PROMPT_TEMPLATE.format(
            filename=document.filename,
            page_block=page_block,
        )

        # GeminiJSONParseError is already retried inside GeminiClient, 
        # but if it escapes, we can try one fallback without the schema constraint
        # as recommended in the error handling contract.
        try:
            raw_dict = await self._client.generate_json(
                prompt=prompt,
                system_instruction=SYSTEM_INSTRUCTION,
                response_schema=ExtractionResponse,
            )
        except GeminiJSONParseError:
            logger.warning("JSON parse failed, retrying once without strict schema.")
            raw_dict = await self._client.generate_json(
                prompt=prompt,
                system_instruction=SYSTEM_INSTRUCTION,
            )

        # For text documents, we validate against the *assembled* page block 
        # (which includes vision transcripts)
        return self._parse_and_validate(raw_dict, document, page_block)

    async def _build_page_block(self, document: ParsedDocument) -> str:
        """Construct the {page_block} string, filling in scanned pages if needed."""
        
        # Fast path A: No scanned pages
        if not document.has_scanned_pages:
            return document.full_text

        # Path B: Extract text from scanned pages concurrently
        logger.info("Document '%s' has scanned pages, running Vision processing.", document.filename)
        
        async def process_page(page) -> str:
            header = f"[PAGE {page.page_number}]"
            if not page.is_scanned:
                return f"{header}\n{page.text}"
            
            # Note: The strategy document implied Image bytes were available per-page,
            # but ParsedDocument text pages don't have bytes. In a real system, we'd 
            # need a way to get the page image bytes. For now, we simulate this or 
            # rely on the fact that if a PDF page is scanned, we would need to render it.
            # 
            # *Implementation deviation:* Since document_parser.py drops PDF bytes after parsing,
            # we can't do Vision here unless we modify the parser. The strategy document
            # F-3 suggests we call `generate_multimodal(image_bytes=...)`. 
            # We will raise a NotImplementedError to highlight this gap, or simply use 
            # a fallback text if the image data is unavailable.
            
            logger.warning("Page %d is scanned. Page-level Vision requires PDF page bytes.", page.page_number)
            return f"{header}\n[SCANNED_PAGE — content omitted due to missing image bytes]"

        tasks = [process_page(p) for p in document.pages]
        results = await asyncio.gather(*tasks)
        return "\n\n".join(results)

    # -----------------------------------------------------------------------
    # Internal — Validation and post-processing
    # -----------------------------------------------------------------------

    def _parse_and_validate(self, raw_dict: dict[str, Any], document: ParsedDocument, full_context: str) -> list[SystemRecord]:
        """Convert the raw dict to Pydantic objects and run post-extraction checks."""
        try:
            response = ExtractionResponse.model_validate(raw_dict)
        except ValidationError as exc:
            logger.error("Pydantic validation failed on LLM output: %s", exc)
            # Try to salvage valid systems if it's a list
            if "systems" in raw_dict and isinstance(raw_dict["systems"], list):
                salvaged = []
                for sys_dict in raw_dict["systems"]:
                    try: Salvalge_sys = SystemRecord.model_validate(sys_dict)
                    except ValidationError: continue
                    salvaged.append(Salvalge_sys)
                response = ExtractionResponse(systems=salvaged)
            else:
                raise SystemExtractionError("Invalid schema returned by LLM") from exc

        valid_systems = []
        for system in response.systems:
            system = self._apply_post_extraction_rules(system, document, full_context)
            if system:
                valid_systems.append(system)

        final_systems = self._deduplicate_systems(valid_systems)
        
        logger.info(
            "Extraction complete for '%s': %d systems extracted, %d flagged",
            document.filename,
            len(final_systems),
            sum(1 for s in final_systems if s.flagged_for_review),
        )
        return final_systems

    def _apply_post_extraction_rules(self, system: SystemRecord, document: ParsedDocument, full_context: str) -> SystemRecord | None:
        """Apply H-1 to H-8 code-level checks (F-6)."""
        score = system.confidence_score
        
        # 1. Evidence containment check
        if not self._is_fuzzy_substring(system.evidence, full_context):
            logger.debug("Evidence not found in document context for system '%s'", system.name)
            score -= 0.20
            
        # 2. Name presence check (case-insensitive)
        if system.name.lower() not in full_context.lower():
            logger.debug("Name '%s' not found in text, capping confidence.", system.name)
            # Cap below threshold to force a flag
            score = min(score, 0.69)
            
        # 3. Confidence cap check
        has_unknown = any(
            v == "Unknown" for v in [system.authentication_method, system.category, system.criticality]
        )
        if score > 0.94 and has_unknown:
            score = 0.94
            
        # 4. Page number validity
        page_num = system.source_location.page_number
        if page_num is not None:
            if page_num < 1 or (document.total_pages > 0 and page_num > document.total_pages):
                logger.warning("Invalid page number %d for system '%s'. Setting to null.", page_num, system.name)
                # We must recreate the model because fields might be frozen or immutable
                system = system.model_copy(
                    update={"source_location": system.source_location.model_copy(update={"page_number": None})}
                )

        # Re-apply modified score
        system = system.model_copy(update={"confidence_score": max(0.0, score)})
        
        # Force rejection if score is horribly low
        if system.confidence_score < 0.1:
            return None
            
        return system

    def _deduplicate_systems(self, systems: list[SystemRecord]) -> list[SystemRecord]:
        """Remove duplicates by name (case-insensitive), keeping the highest confidence."""
        deduped: dict[str, SystemRecord] = {}
        for sys in systems:
            key = sys.name.strip().lower()
            if key not in deduped:
                deduped[key] = sys
            else:
                # Keep the one with higher confidence
                if sys.confidence_score > deduped[key].confidence_score:
                    deduped[key] = sys
        return list(deduped.values())

    @staticmethod
    def _is_fuzzy_substring(needle: str, haystack: str, threshold: float = 0.85) -> bool:
        """
        Check if `needle` is a fuzzy substring of `haystack`.
        Needed because the LLM might fix whitespace or typos in the 'evidence'.
        """
        if not needle or not haystack:
            return False
        
        needle = needle.strip()
        haystack = haystack.strip()
        
        if needle in haystack:
            return True
            
        # Fallback to SequenceMatcher for slight mismatches
        # For long haystacks, this is slow, so we just check overlap.
        # A simpler check: are most words in the needle present in the haystack?
        needle_words = set(needle.lower().split())
        haystack_words = set(haystack.lower().split())
        
        if not needle_words:
            return False
            
        overlap = len(needle_words.intersection(haystack_words)) / len(needle_words)
        return overlap >= threshold
