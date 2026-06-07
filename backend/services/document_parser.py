"""
backend/services/document_parser.py

Converts uploaded files into a uniform ParsedDocument representation
that the rest of the Discovery Agent pipeline can consume.

Supported formats
-----------------
Text-producing formats (→ ParsedDocument with pages):
  PDF  — PyMuPDF page-by-page text extraction with [PAGE N] markers
  TXT  — UTF-8 / latin-1 plain text, treated as single page
  MD   — Markdown plain text, treated as single page
  CSV  — Rows stringified to labelled key=value blocks, single page

Image formats (→ ParsedDocument with ImageContent, no Gemini call):
  PNG  — Raw bytes + MIME type preserved for system_extractor.py
  JPG  — Raw bytes + MIME type preserved for system_extractor.py

Architecture notes
------------------
- No I/O: all functions accept filename (str) + raw bytes.
- No LLM calls: image bytes are stored as-is; Gemini Vision is invoked
  by system_extractor.py, not here.
- All public functions return ParsedDocument; callers branch on
  ParsedDocument.document_type ("text" | "image").
- Scanned PDF pages (zero extractable text) are flagged with a sentinel
  comment so system_extractor.py can handle them via Gemini Vision.
"""

from __future__ import annotations

import csv
import io
import logging
from enum import Enum
from pathlib import Path
from typing import Sequence

import fitz  # PyMuPDF
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Enums & constants
# ---------------------------------------------------------------------------


class DocumentType(str, Enum):
    TEXT = "text"
    IMAGE = "image"


class SupportedExtension(str, Enum):
    PDF = ".pdf"
    TXT = ".txt"
    MD = ".md"
    CSV = ".csv"
    PNG = ".png"
    JPG = ".jpg"
    JPEG = ".jpeg"


# Maps file extension → MIME type (used for image documents only)
_IMAGE_MIME_TYPES: dict[str, str] = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}

# Magic-byte signatures for image format detection fallback
_IMAGE_MAGIC: dict[bytes, str] = {
    b"\x89PNG": "image/png",
    b"\xff\xd8\xff": "image/jpeg",
}

# Sentinel inserted into PageContent.text when a PDF page has no extractable text.
# system_extractor.py inspects this marker to trigger Gemini Vision for the page.
SCANNED_PAGE_SENTINEL = "[SCANNED_PAGE — no extractable text]"

# Minimum non-whitespace characters for a PDF page to be considered textual.
_MIN_TEXT_CHARS = 20


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class PageContent(BaseModel):
    """A single page of extracted text from a text-type document."""

    page_number: int = Field(
        ...,
        ge=1,
        description="1-indexed page number within the source document.",
    )
    text: str = Field(
        ...,
        description=(
            "Extracted text for this page.  "
            f"May equal '{SCANNED_PAGE_SENTINEL}' for scanned PDF pages."
        ),
    )

    @property
    def is_scanned(self) -> bool:
        """True when the page contains no extractable text (scanned PDF)."""
        return self.text.strip() == SCANNED_PAGE_SENTINEL

    @property
    def is_empty(self) -> bool:
        """True when the page has no meaningful content at all."""
        stripped = self.text.strip()
        return not stripped or stripped == SCANNED_PAGE_SENTINEL


class ImageContent(BaseModel):
    """
    Raw image bytes plus MIME type.

    Intentionally holds no text.  Gemini Vision processing is deferred
    to system_extractor.py so document_parser stays LLM-free and testable
    without an API key.
    """

    data: bytes = Field(..., description="Raw image bytes from the uploaded file.")
    mime_type: str = Field(
        ...,
        description="IANA MIME type, e.g. 'image/png' or 'image/jpeg'.",
    )

    model_config = {"arbitrary_types_allowed": True}


class ParsedDocument(BaseModel):
    """
    Unified output of document_parser regardless of input format.

    For text-type documents (PDF, TXT, MD, CSV):
      - document_type = DocumentType.TEXT
      - pages          populated
      - image          None

    For image-type documents (PNG, JPG):
      - document_type = DocumentType.IMAGE
      - pages          empty list
      - image          populated
    """

    filename: str = Field(..., description="Original uploaded filename including extension.")
    document_type: DocumentType = Field(
        ...,
        description="'text' for extractable documents; 'image' for vision-only formats.",
    )
    pages: list[PageContent] = Field(
        default_factory=list,
        description="Ordered list of page contents (text documents only).",
    )
    image: ImageContent | None = Field(
        default=None,
        description="Raw image data (image documents only).",
    )

    model_config = {"arbitrary_types_allowed": True}

    @property
    def total_pages(self) -> int:
        return len(self.pages)

    @property
    def full_text(self) -> str:
        """Concatenated text of all pages with [PAGE N] markers injected."""
        return "\n\n".join(
            f"[PAGE {p.page_number}]\n{p.text}" for p in self.pages
        )

    @property
    def has_scanned_pages(self) -> bool:
        """True when at least one PDF page contained no extractable text."""
        return any(p.is_scanned for p in self.pages)


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------


class DocumentParserError(Exception):
    """Base class for all document_parser errors."""


class UnsupportedFormatError(DocumentParserError):
    """Raised when the file extension is not in SupportedExtension."""

    def __init__(self, filename: str) -> None:
        ext = Path(filename).suffix.lower() or "(no extension)"
        supported = ", ".join(e.value for e in SupportedExtension)
        super().__init__(
            f"Unsupported file format '{ext}' for '{filename}'. "
            f"Accepted formats: {supported}"
        )


class ParseError(DocumentParserError):
    """Raised when parsing fails for a known format."""

    def __init__(self, filename: str, reason: str) -> None:
        super().__init__(f"Failed to parse '{filename}': {reason}")


# ---------------------------------------------------------------------------
# Private parsers
# ---------------------------------------------------------------------------


def _parse_pdf(filename: str, data: bytes) -> ParsedDocument:
    """
    Extract text from every page of a PDF using PyMuPDF.

    Pages where PyMuPDF finds fewer than _MIN_TEXT_CHARS non-whitespace
    characters are assumed to be scanned/image-only pages and receive the
    SCANNED_PAGE_SENTINEL text.  system_extractor.py can then route those
    pages through Gemini Vision.
    """
    try:
        doc: fitz.Document = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:
        raise ParseError(filename, f"PyMuPDF could not open file: {exc}") from exc

    if doc.is_encrypted:
        doc.close()
        raise ParseError(filename, "PDF is password-protected and cannot be read.")

    pages: list[PageContent] = []

    try:
        for idx in range(doc.page_count):
            page: fitz.Page = doc[idx]
            page_number = idx + 1
            raw_text: str = page.get_text("text")  # type: ignore[call-overload]

            non_ws = raw_text.replace(" ", "").replace("\n", "").replace("\t", "")
            if len(non_ws) < _MIN_TEXT_CHARS:
                logger.debug(
                    "%s — page %d has <20 non-whitespace chars; marking as scanned.",
                    filename,
                    page_number,
                )
                text = SCANNED_PAGE_SENTINEL
            else:
                text = raw_text.strip()

            pages.append(PageContent(page_number=page_number, text=text))
    finally:
        doc.close()

    if not pages:
        raise ParseError(filename, "PDF contains no pages.")

    logger.info(
        "%s — extracted %d page(s), %d scanned.",
        filename,
        len(pages),
        sum(1 for p in pages if p.is_scanned),
    )
    return ParsedDocument(
        filename=filename,
        document_type=DocumentType.TEXT,
        pages=pages,
    )


def _parse_text(filename: str, data: bytes) -> ParsedDocument:
    """
    Decode a plain-text or Markdown file as a single page.

    Tries UTF-8 first; falls back to latin-1 which never raises a
    UnicodeDecodeError (covers most legacy enterprise documents).
    """
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        logger.warning("%s — UTF-8 decode failed, falling back to latin-1.", filename)
        text = data.decode("latin-1")

    text = text.strip()
    if not text:
        raise ParseError(filename, "File is empty.")

    logger.info("%s — decoded as text, %d chars.", filename, len(text))
    return ParsedDocument(
        filename=filename,
        document_type=DocumentType.TEXT,
        pages=[PageContent(page_number=1, text=text)],
    )


def _parse_csv(filename: str, data: bytes) -> ParsedDocument:
    """
    Convert a CSV file into a human-readable text block (single page).

    Each row is rendered as a labelled block:

        [Row 1]
        column_a: value1
        column_b: value2

        [Row 2]
        column_a: value3
        ...

    This format is more informative to the LLM than raw comma-separated
    values because the column names are repeated per row.
    """
    try:
        text_content = data.decode("utf-8")
    except UnicodeDecodeError:
        text_content = data.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text_content))

    if reader.fieldnames is None:
        raise ParseError(filename, "CSV has no header row or is empty.")

    fieldnames: Sequence[str] = reader.fieldnames  # type: ignore[assignment]
    blocks: list[str] = [
        f"Columns: {', '.join(str(f) for f in fieldnames)}\n"
    ]

    row_count = 0
    for row_count, row in enumerate(reader, start=1):
        lines = [f"[Row {row_count}]"]
        for key in fieldnames:
            value = row.get(str(key), "").strip()
            lines.append(f"  {key}: {value}")
        blocks.append("\n".join(lines))

    if row_count == 0:
        raise ParseError(filename, "CSV has a header but no data rows.")

    text = "\n\n".join(blocks)
    logger.info("%s — converted %d CSV row(s) to text.", filename, row_count)

    return ParsedDocument(
        filename=filename,
        document_type=DocumentType.TEXT,
        pages=[PageContent(page_number=1, text=text)],
    )


def _parse_image(filename: str, data: bytes) -> ParsedDocument:
    """
    Store image bytes as-is for later Gemini Vision processing.

    MIME type is resolved from the file extension.  If the extension is
    ambiguous or missing, magic bytes are used as a fallback.
    No decoding or LLM call is performed here.
    """
    mime_type = _resolve_image_mime_type(filename, data)
    logger.info("%s — stored %d bytes as %s.", filename, len(data), mime_type)

    return ParsedDocument(
        filename=filename,
        document_type=DocumentType.IMAGE,
        pages=[],
        image=ImageContent(data=data, mime_type=mime_type),
    )


# ---------------------------------------------------------------------------
# MIME type resolution helpers
# ---------------------------------------------------------------------------


def _resolve_image_mime_type(filename: str, data: bytes) -> str:
    """
    Determine MIME type for an image file.

    Resolution order:
    1. File extension (primary — fast and reliable for well-named files)
    2. Magic bytes    (fallback — handles misnamed or extension-less files)
    3. Raise          (if neither method succeeds)
    """
    ext = Path(filename).suffix.lower()
    if ext in _IMAGE_MIME_TYPES:
        return _IMAGE_MIME_TYPES[ext]

    logger.debug(
        "%s — extension '%s' not in MIME map; trying magic bytes.", filename, ext
    )
    for magic, mime in _IMAGE_MAGIC.items():
        if data.startswith(magic):
            return mime

    raise ParseError(
        filename,
        f"Cannot determine image MIME type from extension '{ext}' or file content.",
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def parse_document(filename: str, data: bytes) -> ParsedDocument:
    """
    Parse an uploaded document into a uniform ParsedDocument.

    Parameters
    ----------
    filename:
        Original filename including extension.  Used for format detection
        and included in the returned model for traceability.
    data:
        Raw file bytes as received from the upload handler.

    Returns
    -------
    ParsedDocument
        - document_type="text"  → pages is populated
        - document_type="image" → image is populated, pages is empty

    Raises
    ------
    UnsupportedFormatError
        When the file extension is not in SupportedExtension.
    ParseError
        When parsing fails for a known format (corrupt PDF, empty file, etc.).
    """
    ext = Path(filename).suffix.lower()

    logger.info("Parsing document: '%s' (%d bytes, ext='%s')", filename, len(data), ext)

    match ext:
        case ".pdf":
            return _parse_pdf(filename, data)
        case ".txt" | ".md":
            return _parse_text(filename, data)
        case ".csv":
            return _parse_csv(filename, data)
        case ".png" | ".jpg" | ".jpeg":
            return _parse_image(filename, data)
        case _:
            raise UnsupportedFormatError(filename)


def get_supported_extensions() -> list[str]:
    """Return all supported file extensions as a sorted list of strings."""
    return sorted(e.value for e in SupportedExtension)
