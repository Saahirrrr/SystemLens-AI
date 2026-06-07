"""
backend/models/system.py

Pydantic v2 models for Level 1 output: system discovery and inventory.

Model hierarchy
---------------
SourceLocation          — page and section attribution for a discovered system
SystemRecord            — a single discovered enterprise system (full L1 schema)
InventoryResponse       — the full session inventory returned by GET /inventory

Design notes
------------
- confidence_score is validated to [0.0, 1.0].
- flagged_for_review is a computed field; it cannot be set by callers.
  It is always True when confidence_score < CONFIDENCE_FLAG_THRESHOLD (0.70).
- flagged_count in InventoryResponse is also computed from the systems list,
  preventing the caller from supplying an inconsistent value.
- All Literal type aliases are declared at module level so system_extractor.py
  and the LLM prompt templates can import them for schema generation.
"""

from __future__ import annotations

import uuid
from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    computed_field,
    field_validator,
    model_validator,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CONFIDENCE_FLAG_THRESHOLD: float = 0.70
"""Systems with confidence_score below this value are flagged for human review."""


# ---------------------------------------------------------------------------
# Literal type aliases
# ---------------------------------------------------------------------------

SystemCategory = Literal[
    "CRM",
    "ERP",
    "HRIS",
    "IdP",
    "ITSM",
    "Finance",
    "Communication",
    "Storage",
    "Custom",
]
"""
Canonical enterprise system categories.

CRM          — Customer Relationship Management (e.g. Salesforce, HubSpot)
ERP          — Enterprise Resource Planning (e.g. SAP, Oracle)
HRIS         — Human Resources Information System (e.g. Workday, BambooHR)
IdP          — Identity Provider / SSO (e.g. Okta, Azure AD)
ITSM         — IT Service Management (e.g. ServiceNow, Jira Service Desk)
Finance      — Financial / Accounting systems (e.g. NetSuite, QuickBooks)
Communication— Messaging / email / collaboration (e.g. Slack, Teams)
Storage      — File / object / data storage (e.g. SharePoint, S3, GDrive)
Custom       — Bespoke or unclassifiable internal systems
"""

AuthenticationMethod = Literal[
    "OAuth2",
    "SAML",
    "API Key",
    "Basic Auth",
    "Unknown",
]
"""
Authentication / integration method used by the system.
'Unknown' is used when the document provides no authentication information.
"""

CriticalityLevel = Literal[
    "critical",
    "high",
    "medium",
    "low",
]
"""
Business criticality of the system.

critical — outage immediately impacts revenue or regulatory compliance
high     — outage materially disrupts core business operations
medium   — outage causes significant inconvenience but workarounds exist
low      — non-essential; outage has minimal operational impact
"""


# ---------------------------------------------------------------------------
# SourceLocation
# ---------------------------------------------------------------------------


class SourceLocation(BaseModel):
    """
    Pinpoints where in a source document a system was discovered.

    Used by system_extractor.py to populate attribution data and by the
    InventoryPage to render "filename · page N" source chips on each row.
    """

    model_config = {"frozen": True}

    page_number: int | None = Field(
        default=None,
        ge=1,
        description=(
            "1-indexed page number within the source document.  "
            "None for single-page formats (TXT, MD, CSV) and image documents "
            "where page semantics do not apply."
        ),
    )
    section_hint: str | None = Field(
        default=None,
        max_length=256,
        description=(
            "Optional section heading or context label extracted from the document, "
            "e.g. 'Section 3: IT Infrastructure' or 'Table 2 — System Inventory'. "
            "Provides additional human-readable attribution beyond the page number."
        ),
    )

    @field_validator("section_hint", mode="before")
    @classmethod
    def strip_section_hint(cls, v: str | None) -> str | None:
        """Normalise whitespace; treat blank strings as None."""
        if v is None:
            return None
        stripped = v.strip()
        return stripped if stripped else None


# ---------------------------------------------------------------------------
# SystemRecord
# ---------------------------------------------------------------------------


class SystemRecord(BaseModel):
    """
    A single enterprise system discovered from a document.

    This is the primary Level 1 output unit.  Every field maps directly to
    the Discovery Agent acceptance criteria.  The model is intentionally
    strict: callers cannot set flagged_for_review manually; it is always
    derived from confidence_score.
    """

    # Allow computed_field to appear in serialisation
    model_config = {"populate_by_name": True}

    # ------------------------------------------------------------------
    # Identity
    # ------------------------------------------------------------------

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique identifier for this system record (UUID v4).",
    )
    name: str = Field(
        ...,
        min_length=1,
        max_length=256,
        description="Human-readable name of the system, e.g. 'Salesforce CRM'.",
    )

    # ------------------------------------------------------------------
    # Classification
    # ------------------------------------------------------------------

    category: SystemCategory = Field(
        ...,
        description="Canonical category of the system (see SystemCategory type).",
    )
    authentication_method: AuthenticationMethod = Field(
        ...,
        description=(
            "Primary authentication / integration method.  "
            "Use 'Unknown' when the document provides no evidence."
        ),
    )
    criticality: CriticalityLevel = Field(
        ...,
        description="Business criticality assessed from document evidence.",
    )

    # ------------------------------------------------------------------
    # Semantic content
    # ------------------------------------------------------------------

    key_entities: list[str] = Field(
        ...,
        min_length=1,
        description=(
            "Core data entities managed by this system, "
            "e.g. ['Employee', 'Payroll Run', 'Department'].  "
            "Must contain at least one item."
        ),
    )
    business_processes: list[str] = Field(
        ...,
        min_length=1,
        description=(
            "Business processes this system participates in, "
            "e.g. ['Onboarding', 'Performance Review'].  "
            "Must contain at least one item."
        ),
    )

    # ------------------------------------------------------------------
    # Confidence & grounding
    # ------------------------------------------------------------------

    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description=(
            "Model confidence that this system was correctly identified "
            "from the source document.  Range 0.0–1.0.  "
            f"Values below {CONFIDENCE_FLAG_THRESHOLD} trigger flagged_for_review."
        ),
    )
    evidence: str = Field(
        ...,
        min_length=1,
        description=(
            "Verbatim quote from the source document that justifies this record.  "
            "Must be a direct excerpt — not a paraphrase.  "
            "This is the primary anti-hallucination control."
        ),
    )

    # ------------------------------------------------------------------
    # Source attribution
    # ------------------------------------------------------------------

    source_document: str = Field(
        ...,
        min_length=1,
        description="Filename of the document this system was extracted from.",
    )
    source_location: SourceLocation = Field(
        default_factory=SourceLocation,
        description="Page number and section hint within the source document.",
    )

    # ------------------------------------------------------------------
    # Computed fields
    # ------------------------------------------------------------------

    @computed_field  # type: ignore[prop-decorator]
    @property
    def flagged_for_review(self) -> bool:
        """
        True when confidence_score is below CONFIDENCE_FLAG_THRESHOLD (0.70).

        This field is always derived from confidence_score and cannot be
        overridden by the caller.  The LLM extractor must not attempt to
        set it; the model will recompute it on every instantiation.
        """
        return self.confidence_score < CONFIDENCE_FLAG_THRESHOLD

    # ------------------------------------------------------------------
    # Validators
    # ------------------------------------------------------------------

    @field_validator("key_entities", "business_processes", mode="before")
    @classmethod
    def deduplicate_and_strip(cls, v: list[str]) -> list[str]:
        """
        Strip whitespace from each item and remove exact duplicates,
        preserving insertion order.  Empty strings after stripping are removed.
        """
        seen: set[str] = set()
        result: list[str] = []
        for item in v:
            cleaned = item.strip()
            if cleaned and cleaned not in seen:
                seen.add(cleaned)
                result.append(cleaned)
        return result

    @field_validator("evidence", mode="before")
    @classmethod
    def strip_evidence(cls, v: str) -> str:
        """Strip surrounding whitespace from the verbatim evidence quote."""
        return v.strip()

    @field_validator("name", "source_document", mode="before")
    @classmethod
    def strip_string_fields(cls, v: str) -> str:
        return v.strip()

    @model_validator(mode="after")
    def validate_key_entities_not_empty_after_dedup(self) -> SystemRecord:
        """
        Ensure that after deduplication and stripping, key_entities and
        business_processes still contain at least one meaningful item.
        """
        if not self.key_entities:
            raise ValueError(
                "key_entities must contain at least one non-empty string "
                "after whitespace normalisation."
            )
        if not self.business_processes:
            raise ValueError(
                "business_processes must contain at least one non-empty string "
                "after whitespace normalisation."
            )
        return self


# ---------------------------------------------------------------------------
# InventoryResponse
# ---------------------------------------------------------------------------


class InventoryResponse(BaseModel):
    """
    Full inventory for a session, returned by GET /api/v1/inventory/{session_id}.

    flagged_count is computed from the systems list; it cannot be set
    independently and is always consistent with the records it describes.
    """

    session_id: str = Field(
        ...,
        min_length=1,
        description="Session identifier that groups all documents in this extraction run.",
    )
    systems: list[SystemRecord] = Field(
        default_factory=list,
        description="All system records extracted across all documents in this session.",
    )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def flagged_count(self) -> int:
        """Number of systems with confidence_score below CONFIDENCE_FLAG_THRESHOLD."""
        return sum(1 for s in self.systems if s.flagged_for_review)

    # ------------------------------------------------------------------
    # Convenience accessors
    # ------------------------------------------------------------------

    @property
    def flagged_systems(self) -> list[SystemRecord]:
        """Systems that require human review (confidence_score < threshold)."""
        return [s for s in self.systems if s.flagged_for_review]

    @property
    def confident_systems(self) -> list[SystemRecord]:
        """Systems above the confidence threshold (safe for L2 analysis)."""
        return [s for s in self.systems if not s.flagged_for_review]

    def get_by_name(self, name: str) -> SystemRecord | None:
        """
        Case-insensitive lookup of a system by name.
        Returns the first match or None.
        """
        name_lower = name.strip().lower()
        return next(
            (s for s in self.systems if s.name.lower() == name_lower),
            None,
        )
