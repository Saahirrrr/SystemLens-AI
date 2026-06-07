from pydantic import BaseModel
from typing import Dict

class ArtifactGenerationRequest(BaseModel):
    source_system: str
    destination_system: str
    missing_data_entity: str
    effort_estimate: str

class ArtifactGenerationResponse(BaseModel):
    files: Dict[str, str]
    zip_base64: str
