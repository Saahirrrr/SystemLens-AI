# SystemLens AI

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Python 3.11](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
![Level 3 Complete](https://img.shields.io/badge/Level_3-Complete-success?style=for-the-badge)

## Overview

AI-Powered Enterprise Discovery, Integration Intelligence & Artifact Generation

SystemLens AI is a comprehensive enterprise system designed to analyze uploaded technical documents, extract system inventories, identify missing integration gaps, and automatically generate production-ready code artifacts to bridge those gaps.

## Key Capabilities

- Discover enterprise systems from unstructured documentation
- Extract evidence-backed inventories
- Analyze business use cases
- Identify integration gaps
- Prioritize remediation opportunities
- Generate implementation-ready integration artifacts
- Export executive-ready reports

## Problem Statement

Enterprise systems are highly fragmented, and writing custom connectors to synchronize data between disjointed platforms is a manual, error-prone, and time-consuming process. The challenge was to build an intelligent platform spanning three levels of maturity:
- **Level 1 (System Discovery):** Parse unstructured documents and isolate distinct technical systems.
- **Level 2 (Use Case Mapping & Gap Analysis):** Map business use cases to discovered systems, highlighting integration gaps and visualizing data flows.
- **Level 3 (Artifact Generation):** Automatically synthesize fully functioning, deployable connector code (Python scripts, tests, agent specifications) for the missing integrations.

## Features

### Level 1: System Discovery
- Intelligent PDF/Text parsing.
- Automated extraction of source and destination systems.
- Deep evidence tracking mapping every extracted claim back to the source text.

### Level 2: Use Case Mapping & Gap Analysis
- Interactive Use Case Builder.
- Automated mapping of theoretical use cases against actual discovered inventory.
- Comprehensive Results Dashboard featuring priority tables, system flow graphs, and data gap visualization.

### Level 3: Artifact Generation
- Single-click deployment-ready artifact synthesis.
- Live syntax-highlighted preview of generated code.
- Generates `connector.py` (with retry logic and pagination), `test_connector.py`, `agent.yaml`, `workflow.json`, and standard documentation.

## Architecture

```mermaid
graph TD
    A[Enterprise Documents] --> B[Document Processing]
    B --> C[System Discovery]
    C --> D[Inventory Dashboard]
    D --> E[Use Case Analysis]
    E --> F[Gap Detection Engine]
    F --> G[Results Dashboard]
    G --> H[Artifact Generator]
    H --> I[Connector Bundle]
```

## Tech Stack

**Frontend:**
- **Framework:** Next.js 16 (Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **Data Viz:** Recharts, XYFlow

**Backend:**
- **Framework:** FastAPI
- **Language:** Python 3.11
- **Validation:** Pydantic

**AI Layer:**
- **Model:** Google Gemini
- **Strategy:** Structured schema extraction

## Demo Mode

SystemLens AI includes a built-in demonstration mode designed for immediate evaluation without requiring custom document uploads.

The demo mode comes pre-loaded with realistic enterprise systems, including:
- Workday
- Okta
- Salesforce
- ServiceNow
- Google Drive
- Jira
- Confluence
- Microsoft Teams

This allows users to instantly explore the Inventory Dashboard, Use Case Analysis, and Artifact Generation flows using rich, realistic enterprise data.

## Screenshots

### Landing Page
*(Placeholder: Landing Page)*

### Inventory Dashboard
*(Placeholder: Inventory Dashboard)*

### Analysis Builder
*(Placeholder: Analysis Builder)*

### Results Dashboard
*(Placeholder: Results Dashboard)*

### Artifact Generation
*(Placeholder: Artifact Generation)*

## Local Setup

### Backend
1. Create and activate a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
```
2. Install requirements:
```bash
pip install -r backend/requirements.txt
```
3. Create a `.env` file with your Gemini API key:
```bash
GEMINI_API_KEY="your_api_key_here"
```
4. Start the server:
```bash
PYTHONPATH=. uvicorn backend.main:app --reload
```

### Frontend
1. Navigate to the frontend directory:
```bash
cd frontend
```
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```

## API Endpoints

- `POST /api/v1/documents/upload` - Parses an uploaded document.
- `GET /api/v1/inventory/{session_id}` - Retrieves the parsed system inventory.
- `POST /api/v1/analysis` - Submits defined use cases against the inventory.
- `POST /api/v1/generate-artifacts` - Generates a zip bundle of connector code for an integration gap.

## Demo Flow

1. **Upload:** Provide a system architecture document (PDF or text) or select **View Demo**.
2. **Inventory:** Review the extracted systems and view context evidence.
3. **Analysis:** Define business use cases (e.g., "Sync Employee Data from Workday to Jira").
4. **Results:** View the analysis dashboard and identify critical integration gaps.
5. **Artifact Generation:** Click "Generate Artifacts" on a gap card to receive a complete, deployable Python integration connector.

## Business Impact

SystemLens AI drastically reduces the manual effort traditionally required to:
- Understand sprawling and complex enterprise landscapes.
- Identify integration risks and unearth missing data flows.
- Prioritize integration work based on critical automation gaps.
- Generate implementation starter artifacts, significantly accelerating developer time-to-value.

## Future Improvements

- Support for more complex authentication patterns (OAuth 2.0 flows) in generated connectors.
- Integration with Terraform or Pulumi for infrastructure-as-code generation.
- Real-time connector testing against sandbox environments.

## Author
Saahir
