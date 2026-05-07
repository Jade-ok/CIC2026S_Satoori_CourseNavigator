# CIC2026S Satoori

AI-powered course recommendation tool for university students.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, ReactFlow, Axios
- Backend: FastAPI, Uvicorn, Boto3, Pydantic

## Folder Structure

```
CIC2026S_Satoori/
├── frontend/   React + Vite app
├── backend/    FastAPI app
├── data/       Static JSON data
└── docs/       Documentation
```

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
