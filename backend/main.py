import io
import json
import os
import re
from pathlib import Path

import boto3
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pypdf import PdfReader

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
KB_ID      = os.getenv("BEDROCK_KB_ID", "")
LAMBDA_URL = os.getenv("LAMBDA_URL", "")

bedrock_agent  = boto3.client("bedrock-agent-runtime", region_name=AWS_REGION)
bedrock_runtime = boto3.client("bedrock-runtime", region_name=AWS_REGION)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent.parent / "data"

COURSE_PATTERN = re.compile(r"([A-Z]{3,4})(?:_[A-Z])?\s+(\d{3})(?=\s*\()")

SYSTEM_PROMPT = "You are a UBC academic advisor. Return ONLY valid JSON with no markdown, no code blocks, no extra text."

USER_PROMPT = """\
Student's completed courses: {completed_courses}
Student's goal: "{user_context}"

Relevant course info from syllabi:
{kb_context}

All UBC CS courses and their prereqs: {all_courses}

{career_track_hint}

Your task:
1. Pick 2-3 courses that BEST match the student's goal AND have all prereqs met → these are "recommended"
2. Include the direct prerequisites of each recommended course (only the ones from the course list above)
3. Include the student's completed courses

Return ONLY courses that are directly relevant to the student's goal path. Do NOT include unrelated courses.

Each course gets exactly one state:
- "completed": in the student's completed list
- "recommended": top 2-3 picks for their goal, prereqs met
- "available": direct prereq of a recommended course, prereqs met, not yet completed
- "locked": direct prereq of a recommended course, but missing its own prereq

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
- course_states should have 10-20 courses max — only the relevant path, not all 66
- recommended_courses must have exactly 2-3 entries
- If student writes in Korean, respond in Korean in the message field
"""

_TRACK_KEYWORDS: dict[str, list[str]] = {
    "ai_ml":        ["ai", "machine learning", "ml", "deep learning", "neural", "data science", "nlp", "computer vision"],
    "hci_design":   ["hci", "human computer", "ux", "ui", "design", "interface", "usability", "interaction"],
    "software_eng": ["software engineering", "software engineer", "swe", "backend", "frontend", "full stack", "web dev", "systems"],
    "security":     ["security", "cybersecurity", "cryptography", "hacking", "network security", "privacy"],
    "graphics":     ["graphics", "game", "rendering", "animation", "visual", "opengl", "3d"],
    "theory":       ["theory", "algorithms", "complexity", "theoretical", "math", "formal"],
    "systems":      ["systems", "operating system", "os", "distributed", "parallel", "compiler", "embedded"],
    "data":         ["data", "database", "analytics", "big data", "sql", "data engineer"],
}


def _build_career_hint(user_context: str, tracks: dict) -> str:
    text = user_context.lower()
    best_id, best_score = None, 0
    for track_id, kws in _TRACK_KEYWORDS.items():
        score = sum(1 for kw in kws if kw in text)
        if score > best_score:
            best_score, best_id = score, track_id
    if not best_id or best_score == 0:
        return ""
    track = tracks.get(best_id, {})
    core = track.get("core_courses", [])
    rec  = track.get("recommended_courses", [])
    name = track.get("name", "")
    parts = [f'Career track hint — "{name}":']
    if core:
        parts.append(f"  Core courses: {', '.join(core)}")
    if rec:
        parts.append(f"  Recommended courses: {', '.join(rec)}")
    parts.append("Use these as strong hints when selecting recommended courses (if prereqs are met).")
    return "\n".join(parts) + "\n"


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.strip()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/courses")
def get_courses():
    with open(DATA_DIR / "courses.json") as f:
        return json.load(f)


@app.post("/upload-transcript")
async def upload_transcript(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        reader = PdfReader(io.BytesIO(contents))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        matches = COURSE_PATTERN.findall(text)
        courses = sorted(set(f"{dept} {num}" for dept, num in matches))
    except Exception:
        courses = []
    return {"courses": courses}


class ChatRequest(BaseModel):
    message: str
    completed_courses: list[str]


def _call_bedrock_kb(message: str, completed_courses: list[str]) -> dict:
    # Retrieve relevant syllabus context from Knowledge Base
    kb_context = ""
    if KB_ID:
        try:
            retrieve_resp = bedrock_agent.retrieve(
                knowledgeBaseId=KB_ID,
                retrievalQuery={"text": message},
                retrievalConfiguration={"vectorSearchConfiguration": {"numberOfResults": 8}},
            )
            snippets = [r["content"]["text"] for r in retrieve_resp.get("retrievalResults", [])]
            kb_context = "\n\n".join(snippets)
        except Exception as e:
            print(f"KB retrieve failed: {e}")

    with open(DATA_DIR / "courses.json") as f:
        courses_data = json.load(f)
    with open(DATA_DIR / "career_tracks.json") as f:
        tracks = json.load(f)

    all_courses = [
        {"code": v["code"], "prereqs": v.get("prereqs", [])}
        for v in courses_data.values()
    ]
    career_hint = _build_career_hint(message, tracks)

    prompt = USER_PROMPT.format(
        completed_courses=completed_courses or ["none"],
        user_context=message,
        kb_context=kb_context or "No syllabus context retrieved.",
        all_courses=json.dumps(all_courses),
        career_track_hint=career_hint,
    )

    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4000,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
    }
    response = bedrock_runtime.invoke_model(
        modelId="us.anthropic.claude-sonnet-4-6",
        contentType="application/json",
        accept="application/json",
        body=json.dumps(payload),
    )
    body = json.loads(response["body"].read())
    raw = _strip_fences(body["content"][0]["text"])
    return json.loads(raw)


@app.post("/chat")
def chat(req: ChatRequest):
    # ── 1. Lambda (primary) ───────────────────────────────────────────────────
    if LAMBDA_URL:
        try:
            r = httpx.post(
                LAMBDA_URL,
                json={"userContext": req.message, "completedCourses": req.completed_courses},
                timeout=30,
            )
            if r.status_code == 200:
                data = r.json()
                if "course_states" in data:
                    return JSONResponse(content=data)
                print(f"Lambda bad format: {data}")
            else:
                print(f"Lambda {r.status_code}: {r.text}")
        except Exception as e:
            print(f"Lambda failed: {e}")

    # ── 2. Bedrock KB + invoke_model (fallback) ───────────────────────────────
    try:
        result = _call_bedrock_kb(req.message, req.completed_courses)
        return JSONResponse(content=result)
    except Exception as e:
        print(f"Bedrock KB failed: {e}")

    # ── 3. Hardcoded fallback ─────────────────────────────────────────────────
    return JSONResponse(content={
        "message": "Sorry, I couldn't connect to the AI right now. Here's a general recommendation.",
        "course_states": {
            "CPSC 110": "completed", "CPSC 121": "completed",
            "CPSC 210": "completed", "CPSC 221": "available",
            "CPSC 340": "recommended", "CPSC 422": "locked",
        },
        "recommended_courses": [
            {"code": "CPSC 340", "reason": "Core ML course."},
        ]
    })
