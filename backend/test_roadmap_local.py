import json
from generate_roadmap import lambda_handler

# 1. We mock the exact payload the React frontend will send
mock_event = {
    "body": json.dumps({
        "completedCourses": ["CPSC 110", "CPSC 121", "MATH 100"],
        "userContext": "I have a biology background and want to focus on full-stack development and UI/UX to get a co-op next year."
    })
}

# 2. Fire the Lambda!
print("🚀 Firing payload to generateRoadmap...")
response = lambda_handler(mock_event, None)

# 3. Print the beautifully formatted JSON response
parsed_body = json.loads(response["body"])
print(json.dumps(parsed_body, indent=2))