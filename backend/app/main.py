"""
Main FastAPI Application Entry Point

This file sets up the FastAPI application and includes all API routers.
Used to start the backend server.

DEPENDENCIES:
- FastAPI: Web framework
- CORS middleware: For cross-origin requests

INCLUDES:
- routes_data.py: Data upload and visualization endpoints
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Create FastAPI app instance
app = FastAPI(title="CloudExtelGPT", version="0.1.0")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Note: Feature endpoints are disabled for now; UI-only mode.

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint to verify server is running"""
    return {"status": "running", "environment": settings.ENVIRONMENT}

# Root endpoint
@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "CloudExtelGPT backend is running!"}
