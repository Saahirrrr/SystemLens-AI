"""
backend/api/routes/analysis.py

API routes for executing Level 2 analysis on the inventory.
"""

from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.models.analysis import AnalysisReport, UseCase
from backend.services.analysis_engine import AnalysisEngine, AnalysisEngineError
from backend.storage.session_store import get_inventory

router = APIRouter()
engine = AnalysisEngine()

class AnalysisRequest(BaseModel):
    session_id: str
    use_cases: List[UseCase]

@router.post("", response_model=List[AnalysisReport])
async def run_analysis(request: AnalysisRequest):
    """
    Runs Level 2 analysis against the session's discovered inventory 
    using the provided use cases.
    """
    inventory = get_inventory(request.session_id)
    if not inventory:
        raise HTTPException(
            status_code=404, 
            detail=f"No inventory found for session {request.session_id}. Please upload documents first."
        )
        
    try:
        reports = await engine.analyze_use_cases(inventory, request.use_cases)
    except AnalysisEngineError as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")

    if not reports:
        raise HTTPException(
            status_code=422,
            detail=(
                "Analysis produced no results. This usually means all systems in the "
                "session inventory are flagged for review (confidence < 0.70). "
                "Please review the inventory at GET /api/v1/inventory/{session_id} "
                "before running analysis."
            )
        )

    return reports
