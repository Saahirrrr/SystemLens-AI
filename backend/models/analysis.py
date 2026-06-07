"""
backend/models/analysis.py

Pydantic models for Level 2 analysis output.

Model hierarchy
---------------
UseCase            — input use case provided by the caller
UseCaseMapping     — a system's role within a use case
DataFlow           — a single data movement between two systems
IntegrationGap     — a missing integration identified by the engine
PriorityItem       — a ranked gap with computed priority score
AnalysisReport     — full L2 output for a single use case
AnalysisResponse   — internal LLM response schema (not exposed in API)
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class UseCase(BaseModel):
    """A business use case submitted by the caller for L2 analysis."""

    name: str
    description: str
    trigger: str
    expected_outcome: str
    stated_systems: list[str]


class UseCaseMapping(BaseModel):
    """Maps an inventory system to a role within a use case."""

    system_name: str
    role: Literal["source", "destination", "orchestrator", "validator", "observer"]
    relevance_reason: str
    analysis_confidence: float


class DataFlow(BaseModel):
    """A single data movement between two inventory systems."""

    source_system: str
    destination_system: str
    data_entity: str
    direction: Literal["push", "pull", "bidirectional", "unknown"]
    integration_type: Literal["API", "webhook", "file_transfer", "manual", "unknown"]
    analysis_confidence: float


class IntegrationGap(BaseModel):
    """A missing integration that prevents a use case from running end-to-end."""

    source_system: str
    destination_system: str
    missing_data_entity: str
    gap_reason: str
    effort_estimate: Literal["low", "medium", "high"]
    effort_reasoning: str
    analysis_confidence: float
    flagged_for_review: bool


class PriorityItem(BaseModel):
    """A ranked integration gap with a code-computed priority score."""

    rank: int
    priority_tier: str
    priority_score: float
    source_system: str
    destination_system: str
    missing_data_entity: str
    effort_estimate: str
    business_impact_score: float
    workflow_frequency_score: float
    downstream_dependency_score: float
    analysis_confidence: float
    confidence_penalty: float
    score_breakdown: dict[str, float]


class AnalysisReport(BaseModel):
    """Full Level 2 output for a single use case."""

    use_case_name: str
    generated_at: str
    gap_count: int
    use_case_mappings: list[UseCaseMapping]
    data_flows: list[DataFlow]
    integration_gaps: list[IntegrationGap]
    priority_report: list[PriorityItem]


class AnalysisResponse(BaseModel):
    """
    Internal schema used to constrain the LLM's JSON output.
    Not exposed in the public API.
    """

    use_case_name: str
    use_case_mappings: list[UseCaseMapping]
    data_flows: list[DataFlow]
    integration_gaps: list[IntegrationGap]
