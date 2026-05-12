import json
import os
import boto3

bedrock_client = boto3.client(service_name='bedrock-runtime', region_name='us-west-2')
bedrock_agent_client = boto3.client("bedrock-agent-runtime", region_name='us-west-2')
s3_client = boto3.client('s3', region_name='us-west-2')

S3_BUCKET = os.environ.get("S3_BUCKET", "course-nav-uploads-jinok")
S3_KEY = "courses.json"
S3_CAREER_TRACKS_KEY = "career_tracks.json"
KB_ID = os.environ.get("BEDROCK_KB_ID", "")

SYSTEM_PROMPT = "You are a UBC academic advisor. Return ONLY valid JSON with no markdown, no code blocks, no extra text."

USER_PROMPT = """\
Student's completed courses: {completed_courses}
Student's goal: "{user_context}"

Relevant course content from UBC syllabi (retrieved from Knowledge Base):
{kb_context}

All UBC CS courses and their prereqs: {all_courses}

{career_track_hint}

IMPORTANT:
- Also scan the student's goal text for any courses they mention having completed (e.g. "I took MATH 221", "already have CPSC 110"). Merge those into the completed set.
- If a course is completed, treat all of its prerequisites as already satisfied when determining what is "available" or "locked" — but do NOT add those inferred prerequisites to course_states unless they are explicitly in the student's completed courses list. A student who completed MATH 221 has already passed its prereqs — don't clutter the map by listing MATH 100 or MATH 101 as separate nodes.

Your task:
1. Pick 2-3 courses that BEST match the student's goal AND have all prereqs met → "recommended"
2. Only include courses that are directly on the path to the student's goal:
   - The recommended courses themselves
   - ALL direct prerequisites of recommended courses that are NOT yet completed — including MATH, STAT, and DSCI courses
   - The student's completed courses that are direct prerequisites of a recommended course
3. Do NOT omit MATH/STAT prerequisites of recommended courses — they are critical for ML/AI/Data Science tracks.
4. Do NOT include courses unrelated to the student's goal.
5. Do NOT include prerequisites of already-completed courses — if a course is completed, its prereqs are irrelevant.

Each included course gets exactly one state:
- "completed": in the student's completed list OR mentioned as completed in their goal text
- "recommended": top 2-3 picks for their goal — ALL direct prerequisites must be completed (status "completed"). If any prereq is not completed, it is "locked", not "recommended".
- "available": direct prereq of a recommended course, all ITS prereqs are completed, not yet taken
- "locked": direct prereq of a recommended course, but at least one of its own prereqs is not completed

Return ONLY this exact JSON (no markdown, no code fences):
{{
  "message": "2-3 sentence warm response in the same language as the student's goal. Mention their goal and top recommended course.",
  "course_states": {{
    "CPSC 110": "completed",
    "CPSC 344": "recommended"
  }},
  "recommended_courses": [
    {{"code": "CPSC XXX", "reason": "One sentence: why it fits their goal and prereqs are met."}}
  ]
}}

Rules:
- Only include courses on the student's goal path — omit everything else
- recommended_courses must have exactly 2-3 entries
- If student writes in Korean, respond in Korean in the message field
"""


def _retrieve_from_kb(user_context: str) -> str:
    """Retrieve relevant syllabus content from Bedrock Knowledge Base.

    RAG step: search indexed UBC syllabus PDFs for content semantically related
    to the student's career interest, then inject retrieved snippets into the
    Claude prompt so recommendations are grounded in actual course content.

    Degrades gracefully — returns empty context string if KB_ID is not set or
    retrieval fails, so the handler falls back to metadata-only mode.
    """
    if not KB_ID:
        return "No syllabus context available."
    try:
        response = bedrock_agent_client.retrieve(
            knowledgeBaseId=KB_ID,
            retrievalQuery={"text": user_context},
            retrievalConfiguration={"vectorSearchConfiguration": {"numberOfResults": 8}},
        )
        snippets = [r["content"]["text"] for r in response.get("retrievalResults", [])]
        return "\n\n".join(snippets) if snippets else "No relevant syllabus content found."
    except Exception as e:
        print(f"KB retrieval failed: {e}")
        return "Syllabus context unavailable."


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
    if not tracks:
        return None

    text = user_context.lower()

    # Keys match career_tracks.json IDs exactly
    keywords: dict[str, list[str]] = {
        "ai_ml":          ["ai", "machine learning", "ml", "deep learning", "neural", "data science", "nlp", "computer vision"],
        "hci_design":     ["hci", "human computer", "ux", "ui", "design", "interface", "usability", "interaction"],
        "web_dev":        ["software engineering", "software engineer", "swe", "backend", "frontend", "full stack", "web dev", "web development"],
        "security":       ["security", "cybersecurity", "cryptography", "hacking", "network security", "privacy"],
        "graphics_games": ["graphics", "game", "rendering", "animation", "visual", "opengl", "3d"],
        "systems":        ["systems", "operating system", "os", "distributed", "parallel", "compiler", "embedded"],
        "data_science":   ["data", "database", "analytics", "big data", "sql", "data engineer"],
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
    name = track.get("name", "")
    core = track.get("core_courses", [])
    recommended = track.get("recommended_courses", [])
    math_required = track.get("math_required", [])
    math_recommended = track.get("math_recommended", [])
    parts = [f'Career track hint — "{name}":']
    if core:
        parts.append(f"  Core courses: {', '.join(core)}")
    if recommended:
        parts.append(f"  Recommended courses: {', '.join(recommended)}")
    if math_required:
        parts.append(f"  Required math/stats: {', '.join(math_required)} — MUST include these as prereqs if not completed")
    if math_recommended:
        parts.append(f"  Recommended math/stats: {', '.join(math_recommended)}")
    parts.append("Use these as strong hints. Always include MATH/STAT prerequisites in the course map — they are essential for this track.")
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

        # Step 1: RAG — retrieve relevant syllabus content from Knowledge Base.
        # The KB indexes actual UBC course syllabi as PDFs. Searching with the
        # student's career interest grounds Claude's recommendations in real
        # course content rather than just structured metadata.
        kb_context = _retrieve_from_kb(user_context)

        # Step 2: Load structured metadata from S3 (course codes, prereqs, track hints).
        all_courses = _load_courses_from_s3()
        career_tracks = _load_career_tracks_from_s3()
        career_track_hint = _build_career_track_hint(user_context, career_tracks)

        # Step 3: Build prompt with KB context + metadata, then invoke Claude.
        prompt = USER_PROMPT.format(
            completed_courses=completed_courses or ["none"],
            user_context=user_context,
            kb_context=kb_context,
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
