# test_local.py
import json
import base64
from lambda_function import lambda_handler

# Read a sample PDF you have locally and encode it
with open("sample_transcript.pdf", "rb") as f:
    encoded_pdf = base64.b64encode(f.read()).decode('utf-8')

# Mock the API Gateway event
mock_event = {
    "body": json.dumps({"transcriptBase64": encoded_pdf})
}

# Run it
response = lambda_handler(mock_event, None)
print(response["body"])