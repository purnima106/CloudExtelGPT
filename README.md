# CloudExtelGPT

A full-stack AI assistant with a ChatGPT-like UI and a FastAPI backend.

- Frontend: React 18 + Vite + Tailwind CSS
- Backend: FastAPI + Uvicorn
- Extra: File uploads (images, PDFs, docs), conversation management, polished UI/UX

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git

### 1) Clone and enter the project
```bash
git clone <your-repo-url>
cd CloudExtelGPT
```

### 2) Backend setup (FastAPI)
```bash
cd backend
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt

# Run the API (port 8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 3) Frontend setup (React + Vite)
Open a new terminal:
```bash
cd frontend
npm install

# Optional: set API base (defaults to http://localhost:8000)
echo VITE_API_BASE_URL=http://localhost:8000 > .env

# Run the app (port 3000)
npm run dev
```
- App: http://localhost:3000

Vite proxy already forwards `/api` to `http://localhost:8000` during dev.

---

## Features

- ChatGPT-like layout (messages, avatars, input bar)
- Conversation management: new, select, delete, rename
- File uploads: images, PDFs, documents (up to 10MB each)
- Inline previews for image uploads and file chips in chat
- Responsive layout, mobile-friendly sidebar
- Light theme sidebar, polished gradients, glassmorphism
- Error handling and loading states

---

## Project Structure
```
CloudExtelGPT/
├─ backend/
│  ├─ app/
│  │  ├─ api/              # FastAPI routes
│  │  ├─ core/             # Settings, logging, security
│  │  ├─ models/           # Pydantic schemas
│  │  ├─ services/         # Business logic
│  │  ├─ utils/            # Helpers
│  │  └─ main.py           # FastAPI app entrypoint
│  ├─ requirements.txt
│  └─ Dockerfile
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ context/          # React context (state, API calls)
│  │  ├─ pages/
│  │  ├─ services/
│  │  └─ styles/
│  ├─ index.html
│  └─ vite.config.js
└─ README.md
```

---

## Environment Variables

### Frontend (.env)
- `VITE_API_BASE_URL` (default: `http://localhost:8000`)

### Backend (.env) – optional
Check `backend/app/core/config.py` for available settings. By default, CORS is open for local dev. In production, restrict `allow_origins` to your frontend URL.

---

## API Overview (current)
- `GET /health` – Health check
- `GET /` – Root message
- `Routers under /api` – Data and chat routes (e.g., `/api/chat/message` expected by the frontend)

Note: The frontend sends chat messages and file uploads to `POST /api/chat/message` as `multipart/form-data` with fields:
- `message`: string (optional if files provided)
- `conversation_id`: string (optional)
- `files`: uploaded files (0..N)

Implement/confirm this endpoint in `backend/app/api/routes_chat.py` or unify under your existing routers.

---

## Running with Docker (optional)
A sample backend `Dockerfile` exists.
```bash
cd backend
docker build -t cloudextelgpt-backend .
docker run -p 8000:8000 cloudextelgpt-backend
```
For frontend, you can dockerize via Vite build and any static server (e.g., nginx).

---

## Troubleshooting

- Frontend cannot reach backend
  - Make sure backend runs on `http://localhost:8000`
  - Check `frontend/.env` and `vite.config.js` proxy
  - Confirm CORS config in `backend/app/main.py`

- File uploads fail
  - Ensure `python-multipart` is installed (included in requirements.txt)
  - Confirm your `/api/chat/message` endpoint accepts `multipart/form-data`

- Port conflicts
  - Change frontend port in `vite.config.js` (default 3000)
  - Run uvicorn on another port with `--port 8001` and update `VITE_API_BASE_URL`

- Windows PowerShell execution policy error
  - Run PowerShell as admin: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

## Scripts

Backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:
```bash
npm run dev
npm run build
npm run preview
```

---

## Roadmap
- Auth (JWT) and user sessions
- Persistent conversations (DB)
- RAG pipeline for documents (vector store)
- Streaming responses
- Role-based permissions

---

## License
Proprietary. All rights reserved (update if needed).
