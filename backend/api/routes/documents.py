"""
backend/api/routes/documents.py

API routes for document upload and system extraction.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from backend.services.document_parser import parse_document, DocumentParserError, UnsupportedFormatError
from backend.services.system_extractor import SystemExtractor, SystemExtractionError
from backend.utils.gemini_client import GeminiRetryExhaustedError
from backend.storage.session_store import store_inventory

router = APIRouter()
extractor = SystemExtractor()


class UploadResponse(BaseModel):
    """Response model for POST /documents/upload."""
    session_id: str
    message: str
    systems_extracted: int

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None)
):
    """
    Uploads a document, parses it, extracts systems, and stores them in the session inventory.
    Returns the session ID and number of extracted systems.
    """
    if not session_id or session_id.strip() == "string":
        session_id = str(uuid.uuid4())
        
    try:
        raw_bytes = await file.read()
        parsed_doc = parse_document(file.filename, raw_bytes)
    except UnsupportedFormatError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except DocumentParserError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document parsing failed: {e}")
        
    try:
        systems = await extractor.extract_systems(parsed_doc)
        store_inventory(session_id, systems)
    except SystemExtractionError as e:
        if isinstance(e.__cause__, GeminiRetryExhaustedError):
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "quota_exceeded",
                    "message": "AI extraction quota has been exhausted. Please use Demo Mode or try again later."
                }
            )
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"System extraction failed: {e}")
        
    return {
        "session_id": session_id,
        "message": "Document parsed and systems extracted successfully",
        "systems_extracted": len(systems)
    }
