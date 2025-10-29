from FastAPI import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(title="CloudExtelGPT", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.get("/health")
def health_check():
    return {"status": "running", "environment": settings.ENVIRONMENT}

app.get("/root")
def root():
    return {"message": "CloudExtelGPT backend is running!"}
    