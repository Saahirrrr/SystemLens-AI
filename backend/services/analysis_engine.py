"""
backend/services/analysis_engine.py

Level 2 Analysis Engine. Maps use cases to systems, traces data flows,
and detects integration gaps with confidence-aware priority scoring.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from backend.models.system import SystemRecord
from backend.utils.gemini_client import GeminiClient

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class UseCase(BaseModel):
    name: str
    description: str
    trigger: str
    expected_outcome: str
    stated_systems: list[str]


class UseCaseMapping(BaseModel):
    system_name: str
    role: Literal["source", "destination", "orchestrator", "validator", "observer"]
    relevance_reason: str
    analysis_confidence: float


class DataFlow(BaseModel):
    source_system: str
    destination_system: str
    data_entity: str
    direction: Literal["push", "pull", "bidirectional", "unknown"]
    integration_type: Literal["API", "webhook", "file_transfer", "manual", "unknown"]
    analysis_confidence: float


class IntegrationGap(BaseModel):
    source_system: str
    destination_system: str
    missing_data_entity: str
    gap_reason: str
    effort_estimate: Literal["low", "medium", "high"]
    effort_reasoning: str
    analysis_confidence: float
    flagged_for_review: bool


class PriorityItem(BaseModel):
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
    use_case_name: str
    generated_at: str
    gap_count: int
    use_case_mappings: list[UseCaseMapping]
    data_flows: list[DataFlow]
    integration_gaps: list[IntegrationGap]
    priority_report: list[PriorityItem]


# Internal LLM Response Schema
class AnalysisResponse(BaseModel):
    use_case_name: str
    use_case_mappings: list[UseCaseMapping]
    data_flows: list[DataFlow]
    integration_gaps: list[IntegrationGap]


class AnalysisEngineError(Exception):
    """Raised when Level 2 analysis fails."""
    pass


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

SYSTEM_INSTRUCTION = """
You are an enterprise automation analyst performing Level 2 analysis on a 
verified IT system inventory.

Your task is to:
1. Map business use cases to discovered systems.
2. Trace data flows between systems.
3. Identify integration gaps — missing integrations that are required for a 
   use case to function end-to-end.

HARD RULES — obey these before all other instructions:

1. INVENTORY-LOCKED: You may only reference systems from the provided 
   inventory. Do not invent new systems, vendors, or tools not present in 
   the inventory list.

2. EVIDENCE CHAIN: Every mapping, data flow, and gap you identify must 
   reference the system's "name" exactly as it appears in the inventory.

3. CONFIDENCE INHERITANCE: Your analysis confidence for any finding cannot 
   exceed the minimum confidence_score of the systems involved. If a system 
   has confidence_score 0.75, any finding involving only that system is 
   capped at 0.75.

4. GAPS ARE NOT INVENTIONS: An integration gap is the *absence* of an 
   integration that should logically exist given the use case. You are not 
   inventing new systems — you are flagging the missing link between two 
   existing systems.

5. UNKNOWN IS VALID: If you cannot determine a data flow direction or 
   integration type from the available evidence, use "unknown" as the value.

6. LOW-CONFIDENCE FINDINGS MUST BE FLAGGED: Any analysis result with 
   analysis_confidence < 0.70 must have flagged_for_review = true.

7. EFFORT MUST BE JUSTIFIED: Effort estimates (low / medium / high) must 
   be accompanied by a brief reasoning string, grounded in the number of 
   systems involved and integration complexity.

Output format: a single JSON object matching the schema below.
Do not wrap in markdown code fences.
Do not output any text outside the JSON object.
""".strip()


USER_PROMPT_TEMPLATE = """
INVENTORY
---------
The following systems were discovered from enterprise documents (Level 1).
Each system includes its name, category, authentication method, key entities,
business processes, and a confidence score.

{inventory_json}

USE CASE
--------
Name: {use_case_name}
Description: {use_case_description}
Trigger: {use_case_trigger}
Expected Outcome: {use_case_expected_outcome}
Systems Involved (stated): {stated_systems}

ANALYSIS TASK
-------------
Using ONLY the systems listed in the INVENTORY above, perform the following:

1. USE CASE MAPPING
   - Identify which inventory systems participate in this use case.
   - For each participating system, specify its role (source, destination, 
     orchestrator, validator, or observer).
   - A system is relevant if its key_entities or business_processes overlap 
     with the use case description.

2. DATA FLOW TRACING
   - Identify the sequence of data movements needed to execute this use case.
   - For each step, specify: source_system, destination_system, data_entity,
     direction (push / pull / bidirectional / unknown), and integration_type
     (API / webhook / file_transfer / manual / unknown).
   - Only include flows between systems that are in the INVENTORY.

3. INTEGRATION GAP DETECTION
   - Identify missing integrations: pairs of systems that SHOULD exchange 
     data for the use case to succeed end-to-end, but have no documented 
     integration.
   - A gap exists when: two systems both participate in the use case AND 
     there is no documented data flow between them AND manual workarounds 
     would be required.
   - Do NOT create gaps involving systems outside the INVENTORY.

4. EFFORT ESTIMATION
   For each identified gap, estimate effort:
   - "low":    Existing API available; standard connector; < 1 week
   - "medium": Some custom development required; 1–4 weeks
   - "high":   Complex integration; new middleware required; > 4 weeks

CONFIDENCE SCORING
------------------
For each analysis finding, assign an analysis_confidence score (0.0–1.0).
Rules:
- Start from the minimum confidence_score of all systems involved.
- Apply deductions from the table below.
- Clamp the final score to [0.0, 1.0].

Deduction table:
  - Any involved system has confidence_score < 0.90 : −0.05 per system
  - Data flow direction is "unknown"                : −0.05
  - Integration type is "unknown"                   : −0.05
  - Gap inferred (not stated in use case)           : −0.05
  - Effort estimate lacks API documentation evidence: −0.05

RESPONSE SCHEMA
---------------
Return ONLY this JSON structure:

{{
  "use_case_name": string,
  "use_case_mappings": [ ... ],
  "data_flows": [ ... ],
  "integration_gaps": [ ... ]
}}
""".strip()


# ---------------------------------------------------------------------------
# Analysis Engine
# ---------------------------------------------------------------------------

class AnalysisEngine:
    """
    Engine to perform L2 analysis mapping Use Cases to L1 SystemRecords.
    """

    def __init__(self, gemini_client: GeminiClient | None = None) -> None:
        self._client = gemini_client or GeminiClient()

    async def analyze_use_cases(
        self, inventory: list[SystemRecord], use_cases: list[UseCase]
    ) -> list[AnalysisReport]:
        """Analyze a list of use cases concurrently against the inventory."""
        
        # 1. Filter out flagged systems before building the inventory JSON
        valid_inventory = [s for s in inventory if not s.flagged_for_review]
        if not valid_inventory:
            logger.warning("No unflagged systems available for L2 analysis.")
            return []

        # Deduplicate systems by name to prevent confusing the LLM
        deduped_inventory = {s.name.lower().strip(): s for s in valid_inventory}
        
        inventory_data = []
        for sys in deduped_inventory.values():
            inventory_data.append({
                "name": sys.name,
                "category": sys.category,
                "authentication_method": sys.authentication_method,
                "criticality": sys.criticality,
                "confidence_score": sys.confidence_score,
                "key_entities": sys.key_entities,
                "business_processes": sys.business_processes
            })

        import json
        inventory_json = json.dumps(inventory_data, indent=2)

        # 2. Run analysis concurrently per use case
        semaphore = asyncio.Semaphore(3)
        
        async def _run(uc: UseCase) -> AnalysisReport:
            async with semaphore:
                return await self._analyze_single_use_case(deduped_inventory, inventory_json, uc)

        tasks = [_run(uc) for uc in use_cases]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        reports = []
        for res in results:
            if isinstance(res, Exception):
                logger.error("Failed to analyze use case: %s", res)
            else:
                reports.append(res)
                
        return reports

    async def _analyze_single_use_case(
        self, inventory_dict: dict[str, SystemRecord], inventory_json: str, use_case: UseCase
    ) -> AnalysisReport:
        """Run the LLM analysis for a single use case and compute priorities."""
        logger.info("Analyzing use case: '%s'", use_case.name)
        
        prompt = USER_PROMPT_TEMPLATE.format(
            inventory_json=inventory_json,
            use_case_name=use_case.name,
            use_case_description=use_case.description,
            use_case_trigger=use_case.trigger,
            use_case_expected_outcome=use_case.expected_outcome,
            stated_systems=", ".join(use_case.stated_systems)
        )

        try:
            raw_dict = await self._client.generate_json(
                prompt=prompt,
                system_instruction=SYSTEM_INSTRUCTION,
                response_schema=AnalysisResponse,
            )
            response = AnalysisResponse.model_validate(raw_dict)
        except Exception as exc:
            raise AnalysisEngineError(f"Failed to analyze use case '{use_case.name}': {exc}") from exc

        # Post-process: enforce inventory locking and compute priorities
        report = self._post_process_analysis(inventory_dict, use_case, response)
        return report

    def _post_process_analysis(
        self, inventory_dict: dict[str, SystemRecord], use_case: UseCase, response: AnalysisResponse
    ) -> AnalysisReport:
        """Validates LLM output against inventory and computes priority scores."""
        
        # 1. Enforce inventory locking
        valid_mappings = []
        for m in response.use_case_mappings:
            if m.system_name.lower().strip() in inventory_dict:
                # Cap confidence to max of L1
                l1_sys = inventory_dict[m.system_name.lower().strip()]
                m.analysis_confidence = min(m.analysis_confidence, l1_sys.confidence_score)
                valid_mappings.append(m)
            else:
                logger.warning("LLM hallucinated system '%s' in mappings.", m.system_name)

        valid_flows = []
        for f in response.data_flows:
            src = f.source_system.lower().strip()
            dst = f.destination_system.lower().strip()
            if src in inventory_dict and dst in inventory_dict:
                l1_src = inventory_dict[src]
                l1_dst = inventory_dict[dst]
                f.analysis_confidence = min(f.analysis_confidence, l1_src.confidence_score, l1_dst.confidence_score)
                valid_flows.append(f)
            else:
                logger.warning("LLM hallucinated flow %s -> %s", f.source_system, f.destination_system)

        valid_gaps = []
        for g in response.integration_gaps:
            src = g.source_system.lower().strip()
            dst = g.destination_system.lower().strip()
            if src in inventory_dict and dst in inventory_dict:
                l1_src = inventory_dict[src]
                l1_dst = inventory_dict[dst]
                g.analysis_confidence = min(g.analysis_confidence, l1_src.confidence_score, l1_dst.confidence_score)
                if g.analysis_confidence < 0.70:
                    g.flagged_for_review = True
                valid_gaps.append(g)
            else:
                logger.warning("LLM hallucinated gap %s -> %s", g.source_system, g.destination_system)

        # 2. Compute Priority Report
        priority_items = []
        for gap in valid_gaps:
            src_sys = inventory_dict[gap.source_system.lower().strip()]
            dst_sys = inventory_dict[gap.destination_system.lower().strip()]
            
            p_item = self._compute_priority_item(gap, src_sys, dst_sys, use_case, valid_flows, valid_mappings)
            priority_items.append(p_item)

        # Sort priorities
        priority_items.sort(key=lambda x: x.priority_score, reverse=True)
        for idx, item in enumerate(priority_items, 1):
            item.rank = idx

        return AnalysisReport(
            use_case_name=response.use_case_name,
            generated_at=datetime.utcnow().isoformat() + "Z",
            gap_count=len(valid_gaps),
            use_case_mappings=valid_mappings,
            data_flows=valid_flows,
            integration_gaps=valid_gaps,
            priority_report=priority_items
        )

    def _compute_priority_item(
        self, gap: IntegrationGap, src_sys: SystemRecord, dst_sys: SystemRecord, 
        use_case: UseCase, all_flows: list[DataFlow], all_mappings: list[UseCaseMapping]
    ) -> PriorityItem:
        """Computes priority score based on methodology."""
        
        # 1. Business Impact Score (0.0-1.0)
        criticalities = {src_sys.criticality, dst_sys.criticality}
        if "critical" in criticalities:
            impact_score = 1.0
        elif "high" in criticalities:
            impact_score = 0.75
        elif "medium" in criticalities:
            impact_score = 0.50
        else:
            impact_score = 0.25

        # 2. Workflow Frequency Score (0.0-1.0)
        trigger = use_case.trigger.lower()
        if any(w in trigger for w in ["real-time", "event", "immediate"]):
            freq_score = 1.0
        elif any(w in trigger for w in ["daily", "scheduled", "nightly"]):
            freq_score = 0.75
        elif any(w in trigger for w in ["weekly", "periodic", "monthly"]):
            freq_score = 0.50
        elif any(w in trigger for w in ["ad-hoc", "manual"]):
            freq_score = 0.25
        else:
            freq_score = 0.50  # default

        # 3. Downstream Dependency Score (0.0-1.0)
        dep_count = 0
        dst_name_lower = dst_sys.name.lower().strip()
        for f in all_flows:
            if f.source_system.lower().strip() == dst_name_lower:
                dep_count += 1
        
        for m in all_mappings:
            if m.system_name.lower().strip() == dst_name_lower and m.role == "source":
                dep_count += 1

        if dep_count >= 3:
            dep_score = 1.0
        elif dep_count == 2:
            dep_score = 0.75
        elif dep_count == 1:
            dep_score = 0.50
        else:
            dep_score = 0.25

        # 4. Compute Weighted Score
        weighted_raw = (0.50 * impact_score) + (0.30 * freq_score) + (0.20 * dep_score)
        
        # 5. Apply Confidence Penalty
        confidence_penalty = min(1.0, gap.analysis_confidence / 0.95)
        final_score = weighted_raw * confidence_penalty

        # 6. Assign Tier
        if final_score >= 0.80:
            tier = "P1 — Critical"
        elif final_score >= 0.60:
            tier = "P2 — High"
        elif final_score >= 0.40:
            tier = "P3 — Medium"
        else:
            tier = "P4 — Low"

        return PriorityItem(
            rank=0,  # Assigned after sorting
            priority_tier=tier,
            priority_score=round(final_score, 2),
            source_system=gap.source_system,
            destination_system=gap.destination_system,
            missing_data_entity=gap.missing_data_entity,
            effort_estimate=gap.effort_estimate,
            business_impact_score=impact_score,
            workflow_frequency_score=freq_score,
            downstream_dependency_score=dep_score,
            analysis_confidence=gap.analysis_confidence,
            confidence_penalty=round(confidence_penalty, 3),
            score_breakdown={
                "weighted_raw": round(weighted_raw, 2),
                "after_confidence_penalty": round(final_score, 2)
            }
        )
