"""
backend/storage/session_store.py

In-memory storage for discovered systems across a user session.

Deduplication
-------------
When a system with the same normalised name (lowercased, stripped) already
exists in a session, store_inventory keeps whichever record has the higher
confidence_score. This prevents duplicates accumulating when multiple
documents are uploaded to the same session.
"""

from typing import Dict, List

from backend.models.system import SystemRecord

# session_id -> {normalised_name -> SystemRecord}
_inventory_store: Dict[str, Dict[str, SystemRecord]] = {}


def store_inventory(session_id: str, systems: List[SystemRecord]) -> None:
    """
    Adds discovered systems to a session's inventory.

    If a system with the same name already exists in the session,
    the record with the higher confidence_score is retained.
    """
    if session_id not in _inventory_store:
        _inventory_store[session_id] = {}

    bucket = _inventory_store[session_id]
    for system in systems:
        key = system.name.strip().lower()
        if key not in bucket or system.confidence_score > bucket[key].confidence_score:
            bucket[key] = system


def get_inventory(session_id: str) -> List[SystemRecord]:
    """Retrieves all systems discovered in a session."""
    if session_id not in _inventory_store:
        return []
    return list(_inventory_store[session_id].values())


def session_exists(session_id: str) -> bool:
    """Returns True if the session has been initialised (at least one upload)."""
    return session_id in _inventory_store


def clear_session(session_id: str) -> None:
    """Removes a session's inventory."""
    if session_id in _inventory_store:
        del _inventory_store[session_id]
