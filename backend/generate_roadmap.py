import json
import boto3

bedrock_client = boto3.client(service_name='bedrock-runtime', region_name='us-west-2')
s3_client = boto3.client('s3', region_name='us-west-2')

S3_BUCKET = "course-nav-uploads-jinok"
S3_KEY = "courses.json"
S3_CAREER_TRACKS_KEY = "career_tracks.json"

SYSTEM_PROMPT = "You are a UBC academic advisor. Return ONLY valid JSON with no markdown, no code blocks, no extra text."

USER_PROMPT = """\
Student's completed courses: {completed_courses}
Student's goal: "{user_context}"

All UBC CS courses and their prereqs: {all_courses}

{career_track_hint}

Classify EVERY course above into exactly one state:
- "completed": already in the student's completed list
- "recommended": 2-3 courses that best match the student's goal AND all prereqs are met
- "available": prereqs met but not the top picks for their goal
- "locked": at least one prereq is missing

Return ONLY this exact JSON (no markdown, no code fences):
{{
  "message": "2-3 sentence warm response in the same language as the student's goal. Mention their goal and top recommended course.",
  "course_states": {{
    "CPSC 110": "completed"
  }},
  "recommended_courses": [
    {{"code": "CPSC XXX", "reason": "One sentence: why it fits their goal and prereqs are met."}}
  ]
}}

Rules:
- course_states MUST include ALL courses listed above, no exceptions
- recommended_courses must have exactly 2-3 entries matching the "recommended" state
- If student writes in Korean, respond in Korean in the message field
"""


def _load_courses_from_s3():
    obj = s3_client.get_object(Bucket=S3_BUCKET, Key=S3_KEY)
    data = json.loads(obj["Body"].read())
    return [
        {"code": v["code"], "prereqs": v.get("prereqs", [])}
        for v in data.values()
    ]


def _load_career_tracks_from_s3():
    try:
        obj = s3_client.get_object(Bucket=S3_BUCKET, Key=S3_CAREER_TRACKS_KEY)
        return json.loads(obj["Body"].read())
    except Exception:
        return {}


def _match_track(user_context: str, tracks: dict) -> dict | None:
    """Return the best matching career track based on keyword matching."""
    if not tracks:
        return None

    text = user_context.lower()

    # Keyword sets for each track id
    keywords: dict[str, list[str]] = {
        "ai_ml":         ["ai", "machine learning", "ml", "deep learning", "neural", "data science", "nlp", "computer vision"],
        "hci_design":    ["hci", "human computer", "ux", "ui", "design", "interface", "usability", "interaction"],
        "software_eng":  ["software engineering", "software engineer", "swe", "backend", "frontend", "full stack", "web dev", "systems"],
        "security":      ["security", "cybersecurity", "cryptography", "hacking", "network security", "privacy"],
        "graphics":      ["graphics", "game", "rendering", "animation", "visual", "opengl", "3d"],
        "theory":        ["theory", "algorithms", "complexity", "theoretical", "math", "formal"],
        "systems":       ["systems", "operating system", "os", "distributed", "parallel", "compiler", "embedded"],
        "data":          ["data", "database", "analytics", "big data", "sql", "data engineer"],
    }

    best_track_id = None
    best_score = 0

    for track_id, kws in keywords.items():
        score = sum(1 for kw in kws if kw in text)
        if score > best_score:
            best_score = score
            best_track_id = track_id

    if best_track_id and best_score > 0:
        return tracks.get(best_track_id)
    return None


def _build_career_track_hint(user_context: str, tracks: dict) -> str:
    track = _match_track(user_context, tracks)
    if not track:
        return ""
    core = track.get("core_courses", [])
    recommended = track.get("recommended_courses", [])
    name = track.get("name", "")
    parts = [f'Career track hint — "{name}":']
    if core:
        parts.append(f"  Core courses: {', '.join(core)}")
    if recommended:
        parts.append(f"  Recommended courses: {', '.join(recommended)}")
    parts.append("Use these as strong hints when selecting recommended courses (if prereqs are met).")
    return "\n".join(parts) + "\n"


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.strip()


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        completed_courses = body.get("completedCourses", [])
        user_context = body.get("userContext", "I want to get a software engineering job.")

        all_courses = _load_courses_from_s3()
        career_tracks = _load_career_tracks_from_s3()
        career_track_hint = _build_career_track_hint(user_context, career_tracks)

        prompt = USER_PROMPT.format(
            completed_courses=completed_courses or ["none"],
            user_context=user_context,
            all_courses=json.dumps(all_courses),
            career_track_hint=career_track_hint,
        )

        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
        }

        response = bedrock_client.invoke_model(
            modelId="us.anthropic.claude-sonnet-4-6",
            contentType="application/json",
            accept="application/json",
            body=json.dumps(payload),
        )

        response_body = json.loads(response["body"].read())
        raw = _strip_fences(response_body["content"][0]["text"])

        json.loads(raw)  # validate

        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
            "body": raw,
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)}),
        }
