from fastapi import APIRouter, HTTPException
from backend.models.artifacts import ArtifactGenerationRequest, ArtifactGenerationResponse
from backend.services.artifact_generator import ArtifactGenerator

router = APIRouter()
generator = ArtifactGenerator()

@router.post("", response_model=ArtifactGenerationResponse)
async def generate_artifacts(request: ArtifactGenerationRequest):
    """
    Generates connector artifacts based on an integration gap.
    Returns both the plain text of the generated files (for preview) 
    and a base64 encoded ZIP archive.
    """
    try:
        response = generator.generate(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
