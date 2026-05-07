import json
import base64
import re
import io
from pypdf import PdfReader

def lambda_handler(event, context):
    try:
        # 1. Extract the base64 PDF string from the frontend payload
        body = json.loads(event.get("body", "{}"))
        pdf_base64 = body.get("transcriptBase64")
        
        if not pdf_base64:
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "No PDF provided."})
            }

        # 2. Decode the base64 string into raw bytes
        pdf_bytes = base64.b64decode(pdf_base64)
        
        # 3. Read the PDF using pypdf
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        
        extracted_text = ""
        for page in reader.pages:
            extracted_text += page.extract_text() + "\n"

        # --- ADD THESE TWO LINES ---
        print("🔍 RAW TEXT SNEAK PEEK:")
        print(repr(extracted_text[:1000])) 
        # ---------------------------
        
        # 4. Run the Regex (UBC Unofficial Transcript Edition)
        # ([A-Z]{3,4}) -> Captures the 3-4 letter code (CPSC, INFO)
        # (?:_[A-Z])? -> Optionally ignores the "_V" or "_O" campus code
        # \s+ -> Handles the spaces
        # (\d{3}) -> Captures the 3-digit course number
        # (?=\s*\() -> ONLY matches if a credit parenthesis like "(4.0)" comes next!
        course_pattern = r"([A-Z]{3,4})(?:_[A-Z])?\s+(\d{3})(?=\s*\()"
        raw_matches = re.findall(course_pattern, extracted_text)

        # 5. Clean up and deduplicate the list
        clean_courses = [f"{dept} {num}" for dept, num in raw_matches]
        unique_courses = list(set(clean_courses))

        # 6. Return the perfectly formatted JSON to the frontend
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*", # Fixes CORS for Amplify
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "completed_courses": unique_courses,
                "message": f"Successfully parsed {len(unique_courses)} courses."
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)})
        }