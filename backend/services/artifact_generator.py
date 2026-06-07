import io
import zipfile
import base64
import json
from backend.models.artifacts import ArtifactGenerationRequest, ArtifactGenerationResponse

class ArtifactGenerator:
    """Service to generate deployable connector artifacts for a given integration gap."""

    def generate(self, req: ArtifactGenerationRequest) -> ArtifactGenerationResponse:
        src = req.source_system
        dst = req.destination_system
        entity = req.missing_data_entity
        
        src_lower = src.lower().replace(" ", "_")
        dst_lower = dst.lower().replace(" ", "_")
        prefix = f"{src_lower}_{dst_lower}"
        
        files = {
            f"{prefix}_connector.py": self._generate_connector(src, dst, entity),
            f"{prefix}_test.py": self._generate_test_connector(src, dst, entity),
            f"{prefix}_agent.yaml": self._generate_agent_yaml(src, dst, entity),
            f"{prefix}_workflow.json": self._generate_workflow_json(src, dst, entity),
            "requirements.txt": self._generate_requirements(),
            "README.md": self._generate_readme(src, dst, entity),
        }
        
        # Create ZIP in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for filename, content in files.items():
                zip_file.writestr(filename, content)
                
        zip_base64 = base64.b64encode(zip_buffer.getvalue()).decode("utf-8")
        
        return ArtifactGenerationResponse(files=files, zip_base64=zip_base64)

    def _generate_connector(self, src: str, dst: str, entity: str) -> str:
        return f'''"""
Connector for synchronizing {entity} from {src} to {dst}.
"""
import os
import logging
from typing import Dict, Any, List, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

class RateLimitException(Exception):
    pass

class ConnectorError(Exception):
    pass

class {src.replace(" ", "")}To{dst.replace(" ", "")}Connector:
    """Handles authentication, pagination, and CRUD operations for {entity}."""

    def __init__(self):
        self.src_api_key = os.getenv("{src.upper().replace(" ", "_")}_API_KEY")
        self.dst_api_key = os.getenv("{dst.upper().replace(" ", "_")}_API_KEY")
        
        if not self.src_api_key or not self.dst_api_key:
            raise ValueError("API keys for both {src} and {dst} must be set in the environment.")
            
        self.src_base_url = os.getenv("{src.upper().replace(" ", "_")}_BASE_URL", "https://api.{src.lower().replace(" ", "")}.com/v1")
        self.dst_base_url = os.getenv("{dst.upper().replace(" ", "_")}_BASE_URL", "https://api.{dst.lower().replace(" ", "")}.com/v1")
        
        self.session = self._setup_session()

    def _setup_session(self) -> requests.Session:
        """Configures a requests session with robust connection pooling and base retries."""
        session = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[408, 429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST", "PUT"]
        )
        adapter = HTTPAdapter(max_retries=retries, pool_connections=10, pool_maxsize=10)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        return session

    def authenticate(self) -> bool:
        """Validates credentials against both systems."""
        try:
            # Authenticate with Source
            src_response = self.session.get(
                f"{{self.src_base_url}}/auth/verify",
                headers={{"Authorization": f"Bearer {{self.src_api_key}}"}}
            )
            src_response.raise_for_status()
            
            # Authenticate with Destination
            dst_response = self.session.get(
                f"{{self.dst_base_url}}/auth/verify",
                headers={{"Authorization": f"Bearer {{self.dst_api_key}}"}}
            )
            dst_response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Authentication failed: {{e}}")
            return False

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((requests.exceptions.ConnectionError, requests.exceptions.Timeout, RateLimitException))
    )
    def fetch_records(self, limit: int = 100, cursor: Optional[str] = None) -> Dict[str, Any]:
        """Fetches {entity} records from {src} with pagination."""
        url = f"{{self.src_base_url}}/{entity.lower().replace(" ", "_")}s"
        params = {{"limit": limit}}
        if cursor:
            params["cursor"] = cursor
            
        response = self.session.get(
            url,
            headers={{"Authorization": f"Bearer {{self.src_api_key}}"}},
            params=params,
            timeout=10
        )
        
        if response.status_code == 429:
            logger.warning("Rate limit hit on source system.")
            raise RateLimitException("Rate limit exceeded")
            
        response.raise_for_status()
        return response.json()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        retry=retry_if_exception_type((requests.exceptions.ConnectionError, requests.exceptions.Timeout))
    )
    def create_record(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new {entity} record in {dst}."""
        url = f"{{self.dst_base_url}}/{entity.lower().replace(" ", "_")}s"
        response = self.session.post(
            url,
            headers={{"Authorization": f"Bearer {{self.dst_api_key}}", "Content-Type": "application/json"}},
            json=data,
            timeout=10
        )
        response.raise_for_status()
        return response.json()
        
    def sync_all(self) -> int:
        """Executes a full synchronization pipeline, handling pagination."""
        logger.info("Starting synchronization pipeline...")
        if not self.authenticate():
            raise ConnectorError("Cannot start sync; authentication failed.")
            
        cursor = None
        records_processed = 0
        has_more = True
        
        while has_more:
            page = self.fetch_records(limit=100, cursor=cursor)
            records = page.get("data", [])
            
            for record in records:
                try:
                    # In a real scenario, transformation logic happens here
                    transformed = self._transform(record)
                    self.create_record(transformed)
                    records_processed += 1
                except Exception as e:
                    logger.error(f"Failed to sync record {{record.get('id')}}: {{e}}")
                    
            cursor = page.get("next_cursor")
            has_more = bool(cursor)
            
        logger.info(f"Synchronization complete. Processed {{records_processed}} records.")
        return records_processed
        
    def _transform(self, source_record: Dict[str, Any]) -> Dict[str, Any]:
        """Transforms source schema to destination schema."""
        # Baseline identity mapping
        return source_record
'''

    def _generate_test_connector(self, src: str, dst: str, entity: str) -> str:
        prefix = f"{src.lower().replace(' ', '_')}_{dst.lower().replace(' ', '_')}"
        return f'''import pytest
from unittest.mock import Mock, patch
import requests
from {prefix}_connector import {src.replace(" ", "")}To{dst.replace(" ", "")}Connector, RateLimitException, ConnectorError

@pytest.fixture
def mock_env(monkeypatch):
    monkeypatch.setenv("{src.upper().replace(" ", "_")}_API_KEY", "test_src_key")
    monkeypatch.setenv("{dst.upper().replace(" ", "_")}_API_KEY", "test_dst_key")

@pytest.fixture
def connector(mock_env):
    return {src.replace(" ", "")}To{dst.replace(" ", "")}Connector()

def test_init_missing_keys(monkeypatch):
    monkeypatch.delenv("{src.upper().replace(" ", "_")}_API_KEY", raising=False)
    with pytest.raises(ValueError):
        {src.replace(" ", "")}To{dst.replace(" ", "")}Connector()

@patch('requests.Session.get')
def test_authenticate_success(mock_get, connector):
    mock_resp = Mock()
    mock_resp.status_code = 200
    mock_resp.raise_for_status.return_value = None
    mock_get.return_value = mock_resp
    
    assert connector.authenticate() is True
    assert mock_get.call_count == 2

@patch('requests.Session.get')
def test_fetch_records_success(mock_get, connector):
    mock_resp = Mock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {{"data": [{{"id": "1"}}], "next_cursor": "abc"}}
    mock_get.return_value = mock_resp
    
    result = connector.fetch_records()
    assert len(result["data"]) == 1
    assert result["next_cursor"] == "abc"

@patch('requests.Session.get')
def test_fetch_records_rate_limit(mock_get, connector):
    mock_resp = Mock()
    mock_resp.status_code = 429
    mock_get.return_value = mock_resp
    
    with pytest.raises(RateLimitException):
        connector.fetch_records.retry.stop = Mock(return_value=True) # Bypass retry for test
        connector.fetch_records()

@patch('requests.Session.post')
def test_create_record_success(mock_post, connector):
    mock_resp = Mock()
    mock_resp.status_code = 201
    mock_resp.json.return_value = {{"id": "new_1", "status": "created"}}
    mock_post.return_value = mock_resp
    
    result = connector.create_record({{"name": "test"}})
    assert result["status"] == "created"
    assert mock_post.called
'''

    def _generate_agent_yaml(self, src: str, dst: str, entity: str) -> str:
        return f'''name: {src.replace(" ", "")}To{dst.replace(" ", "")}SyncAgent
version: "1.0.0"
description: "Autonomous agent responsible for reconciling {entity} between {src} and {dst}."

system_prompt: |
  You are an enterprise integration agent. Your objective is to ensure that {entity} records 
  are properly synchronized from {src} to {dst}. 
  You must handle rate limits gracefully, log all discrepancies, and ensure no data is lost 
  during transmission. If {dst} rejects a record, you must evaluate the schema difference 
  and apply transformations if possible.

tool_bindings:
  - name: fetch_{src.lower().replace(" ", "_")}_records
    module: connector
    function: fetch_records
  - name: create_{dst.lower().replace(" ", "_")}_record
    module: connector
    function: create_record

workflow_steps:
  - id: step_1_auth
    action: authenticate
    on_failure: halt
  - id: step_2_extract
    action: fetch_{src.lower().replace(" ", "_")}_records
    retry_policy: exponential_backoff
  - id: step_3_load
    action: create_{dst.lower().replace(" ", "_")}_record
    batch_size: 50

test_scenarios:
  - name: "Happy Path Sync"
    mock_source: "valid_{entity.lower().replace(' ', '_')}.json"
    expected_outcome: "success"
  - name: "Rate Limit Handling"
    mock_source: "429_response"
    expected_outcome: "retry_and_succeed"
'''

    def _generate_workflow_json(self, src: str, dst: str, entity: str) -> str:
        return json.dumps({
            "source_system": src,
            "destination_system": dst,
            "entity": entity,
            "workflow_steps": [
                {"step": 1, "action": "Validate Environment Credentials", "system": "Local"},
                {"step": 2, "action": f"Authenticate to {src}", "system": src},
                {"step": 3, "action": f"Authenticate to {dst}", "system": dst},
                {"step": 4, "action": f"Fetch paginated {entity}", "system": src},
                {"step": 5, "action": "Transform schema", "system": "Local"},
                {"step": 6, "action": f"Push records to {dst}", "system": dst},
                {"step": 7, "action": "Log metrics and exit", "system": "Local"}
            ]
        }, indent=2)

    def _generate_requirements(self) -> str:
        return '''requests>=2.31.0
tenacity>=8.2.3
pytest>=7.4.0
pyyaml>=6.0.1
pydantic>=2.0.0
'''

    def _generate_readme(self, src: str, dst: str, entity: str) -> str:
        prefix = f"{src.lower().replace(' ', '_')}_{dst.lower().replace(' ', '_')}"
        return f'''# {src} to {dst} Connector

## Overview
This connector is an enterprise-grade integration script designed to extract `{entity}` from `{src}` and load it into `{dst}`. 

It features:
- **Resiliency**: Built-in exponential backoff for rate limits using `tenacity`.
- **Pagination**: Fully supports paginated extraction from source APIs.
- **Connection Pooling**: Uses `requests.Session` with custom HTTPAdapters.
- **Test Coverage**: Includes a standard test suite via `pytest`.

## Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Environment Variables
Create a `.env` file or export the following variables:

```bash
export {src.upper().replace(" ", "_")}_API_KEY="your_source_api_key"
export {dst.upper().replace(" ", "_")}_API_KEY="your_destination_api_key"
```

## Usage

You can use the connector directly in a Python script:

```python
from {prefix}_connector import {src.replace(" ", "")}To{dst.replace(" ", "")}Connector

connector = {src.replace(" ", "")}To{dst.replace(" ", "")}Connector()
records_synced = connector.sync_all()
print(f"Successfully synced {{records_synced}} records.")
```

## Testing

Run the provided test suite using pytest:

```bash
pytest {prefix}_test.py -v
```

## Deployment Notes
- When deploying as a scheduled cron job or serverless function, ensure the timeout exceeds the maximum pagination processing time.
- The `agent.yaml` is provided for orchestration within an Agentic Framework.
'''
