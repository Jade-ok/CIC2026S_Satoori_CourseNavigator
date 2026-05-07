import json
from pathlib import Path

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

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


@app.post("/recommend")
def recommend():
    return {"recommendations": []}
