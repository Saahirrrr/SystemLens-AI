import requests
import base64
import zipfile
import io
import json

url = "http://127.0.0.1:8001/api/v1/generate-artifacts"
payload = {
    "source_system": "Workday",
    "destination_system": "Jira",
    "missing_data_entity": "Employee Information",
    "effort_estimate": "medium"
}

print(f"Sending POST to {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")

response = requests.post(url, json=payload)
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    files = data.get("files", {})
    
    print(f"\nKeys in response: {list(data.keys())}")
    print(f"Files found in response payload: {list(files.keys())}")
    
    zip_b64 = data.get("zip_base64")
    
    if zip_b64:
        zip_bytes = base64.b64decode(zip_b64)
        print(f"Decoded ZIP size: {len(zip_bytes)} bytes")
        
        with open("test_bundle.zip", "wb") as f:
            f.write(zip_bytes)
            
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            print("\nContents of extracted ZIP:")
            for info in z.infolist():
                print(f" - {info.filename}: {info.file_size} bytes")
                
            # Verify specific contents
            connector_code = z.read("workday_jira_connector.py").decode("utf-8")
            tests_code = z.read("workday_jira_test.py").decode("utf-8")
            yaml_code = z.read("workday_jira_agent.yaml").decode("utf-8")
            
            print(f"\nConnector methods check:")
            print(" - authenticate:", "def authenticate(" in connector_code)
            print(" - fetch_records:", "def fetch_records(" in connector_code)
            print(" - create_record:", "def create_record(" in connector_code)
            print(" - retry logic:", "@retry" in connector_code)
            
            print(f"Test methods check:")
            print(" - pytest imported:", "import pytest" in tests_code)
            print(" - fetch_records tested:", "def test_fetch_records" in tests_code)
            
            print(f"YAML config check:")
            print(" - system_prompt:", "system_prompt:" in yaml_code)
            print(" - tool_bindings:", "tool_bindings:" in yaml_code)
            print(" - workflow_steps:", "workflow_steps:" in yaml_code)
            print(" - test_scenarios:", "test_scenarios:" in yaml_code)
else:
    print("Error:", response.text)
