# CloudExtelGPT Backend (FastAPI)

## Setup

Requirements: Python 3.10+

```bash
cd backend
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Environment
Optional `.env` variables are loaded via `pydantic-settings` from `app/core/config.py`.

## CORS
CORS is open for local dev in `app/main.py`. Restrict `allow_origins` in production.

## Chat Endpoint (expected by frontend)
The frontend sends messages and files to `POST /api/chat/message` as `multipart/form-data` with fields:
- `message`: string (optional)
- `conversation_id`: string (optional)
- `files`: 0..N files

Return payload should include:
```json
{
  "response": "Assistant reply ...",
  "conversation_id": "<id>"
}
```

Implement this route in `app/api/routes_chat.py` or the relevant router and include it in `app/main.py` under prefix `/api`.

## Docker
```bash
docker build -t cloudextelgpt-backend .
docker run -p 8000:8000 cloudextelgpt-backend
```
