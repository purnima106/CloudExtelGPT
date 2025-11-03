from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    """Application settings and configuration
    
    This file contains all environment variables and configuration settings.
    Used by: main.py, data_service.py, all API routes
    """
    
    # Application Settings
    APP_NAME: str = "CloudExtelGPT"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # API Settings
    API_V1_PREFIX: str = "/api"
    
    # File Upload Settings
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB in bytes
    ALLOWED_EXCEL_EXTENSIONS: list = [".xlsx", ".xls", ".csv"]
    UPLOAD_DIR: str = "uploads"  # Directory for temporary file storage
    
    # Data Processing Settings
    MAX_DATA_ROWS_PREVIEW: int = 1000  # Maximum rows to return in preview
    DATA_CACHE_TTL: int = 3600  # Cache TTL in seconds (1 hour)
    
    # Database Settings (if needed later)
    DATABASE_URL: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

