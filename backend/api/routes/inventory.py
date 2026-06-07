"""
backend/api/routes/inventory.py

API routes for retrieving the discovered system inventory.
"""

from fastapi import APIRouter, HTTPException

from backend.storage.session_store import get_inventory, session_exists
from backend.models.system import InventoryResponse

router = APIRouter()

@router.get("/{session_id}", response_model=InventoryResponse)
async def get_session_inventory(session_id: str):
    """
    Retrieves the full inventory of systems discovered so far in the specified session.
    Returns 404 if the session does not exist.
    """
    if not session_exists(session_id):
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found. Upload a document first to create a session."
        )
    systems = get_inventory(session_id)
    return InventoryResponse(session_id=session_id, systems=systems)
