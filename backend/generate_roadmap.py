import json
import boto3

# Initialize the Bedrock client for the Canada region
bedrock_client = boto3.client(service_name='bedrock-runtime', region_name='ca-central-1')

def lambda_handler(event, context):
    try:
        # 1. Get the inputs from the frontend
        body = json.loads(event.get("body", "{}"))
        completed_courses = body.get("completedCourses", [])
        user_context = body.get("userContext", "I want to get a software engineering job.")

        # 2. Mock our Database (To save time in the hackathon!)
        # Later, we can pull this from S3 if we have time.
        available_courses = [
            {"code": "CPSC 310", "track": "software_eng", "prereqs": ["CPSC 210", "CPSC 221"]},
            {"code": "CPSC 340", "track": "ai_ml", "prereqs": ["CPSC 221", "MATH 200"]},
            {"code": "CPSC 416", "track": "systems", "prereqs": ["CPSC 313", "CPSC 320"]}
            # ... we will expand this list shortly
        ]

        # 3. Build the prompt for Claude
        system_prompt = "You are a UBC academic advisor. Return ONLY valid JSON."
        user_prompt = f"""
        The student has completed: {completed_courses}
        Their goal (in their own words): "{user_context}"
        Available courses: {json.dumps(available_courses)}
        
        Generate a semester-by-semester course roadmap prioritizing their goal.
        Return ONLY valid JSON in this exact format:
        {{
          "inferredGoal": "track_name",
          "semesters": [
            {{ "label": "Year 3 Winter Term 1", "courses": [ {{"code": "CPSC 310", "reason": "..."}} ] }}
          ]
        }}
        """

        # 4. Format the payload for Claude 3 Sonnet
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": [{"type": "text", "text": user_prompt}]}
            ]
        }

        # 5. Call AWS Bedrock!
        response = bedrock_client.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0", # Standard Claude 3 Sonnet ID
            contentType="application/json",
            accept="application/json",
            body=json.dumps(payload)
        )

        # 6. Parse the response from Claude
        response_body = json.loads(response.get('body').read())
        claude_output = response_body.get('content')[0].get('text')

        # Return the generated roadmap to the React frontend
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": claude_output # This is already a JSON string from Claude
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)})
        }