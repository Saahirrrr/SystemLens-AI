"""
backend/main.py

FastAPI application entrypoint for Discovery Agent.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import documents, inventory, analysis, artifacts

app = FastAPI(
    title="Discovery Agent API",
    description="API for parsing enterprise documents, extracting system inventories, and analyzing automation use cases.",
    version="1.0.0"
)

# Add CORS middleware to allow the React frontend to communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["Inventory"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(artifacts.router, prefix="/api/v1/generate-artifacts", tags=["Artifacts"])

@app.get("/health", tags=["Health"])
def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy"}
