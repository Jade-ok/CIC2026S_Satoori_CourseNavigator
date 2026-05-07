import json
import os
from pathlib import Path

import boto3
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
KB_ID      = os.getenv("BEDROCK_KB_ID", "")
MODEL_ID   = os.getenv("BEDROCK_MODEL_ID", "")

bedrock = boto3.client("bedrock-agent-runtime", region_name=AWS_REGION)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent.parent / "data"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/courses")
def get_courses():
    with open(DATA_DIR / "courses.json") as f:
        return json.load(f)


@app.post("/upload-transcript")
async def upload_transcript(file: UploadFile = File(...)):  # noqa: ARG001
    return {"courses": []}


SYSTEM_PROMPT = """\
You are BridgeUBC, an AI academic advisor for UBC Computer Science students. Your users are often career-pivoters or international students who need clear, confident guidance about their course path. You help them understand prerequisites, plan electives, and align coursework with career goals like full-stack development, AI/ML, security, or co-op preparation.

Use the provided knowledge base context to answer accurately. NEVER invent prerequisites or course information — only use what is in the knowledge base. If a course is not in the knowledge base, say so honestly.

Search results: $search_results$

Student's completed courses: {completed_courses}
Student's question: {message}

Analyze the student's question to:
1. Identify their career interest (full-stack, AI/ML, security, data science, etc.)
2. Identify which courses they could take next based on completed prerequisites
3. Recommend 2-3 most relevant courses for their stated goal

Respond ONLY in this exact JSON format. No markdown, no code blocks, no extra text:

{{
  "message": "A warm, 2-3 sentence response in the same language as the student's question. Mention their goal and the top recommended course briefly.",
  "course_states": {{
    "CPSC 110": "completed",
    "CPSC 221": "available",
    "CPSC 340": "recommended",
    "CPSC 422": "locked"
  }},
  "recommended_courses": [
    {{
      "code": "CPSC XXX",
      "reason": "One sentence explaining why this course matches their goal and prerequisites are met."
    }}
  ]
}}

Rules:
- "course_states" should include all courses mentioned in your reasoning (completed, available next, recommended, or locked behind missing prereqs)
- "recommended_courses" must contain 2-3 courses that the student CAN take now (prereqs met) AND match their stated goal
- States: "completed" (already done), "available" (prereqs met), "recommended" (top picks for their goal), "locked" (missing prereqs)
- If the student writes in Korean, respond in Korean. If English, English.
- Be encouraging and direct. Avoid academic jargon.
"""


class ChatRequest(BaseModel):
    message: str
    completed_courses: list[str]


@app.post("/chat")
def chat(req: ChatRequest):
    prompt = SYSTEM_PROMPT.format(
        completed_courses=", ".join(req.completed_courses) or "none",
        message=req.message,
    )
    model_arn = f"arn:aws:bedrock:{AWS_REGION}::foundation-model/{MODEL_ID}"
    try:
        response = bedrock.retrieve_and_generate(
            input={"text": req.message},
            retrieveAndGenerateConfiguration={
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": KB_ID,
                    "modelArn": model_arn,
                    "generationConfiguration": {
                        "promptTemplate": {
                            "textPromptTemplate": prompt,
                        },
                    },
                },
            },
        )
        raw = response["output"]["text"].strip()
        if raw.startswith("```json"):
            raw = raw[len("```json"):]
        elif raw.startswith("```"):
            raw = raw[len("```"):]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()
        try:
            return JSONResponse(content=json.loads(raw))
        except json.JSONDecodeError:
            return JSONResponse(status_code=500, content={"error": "Failed to parse AI response", "raw": raw})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
