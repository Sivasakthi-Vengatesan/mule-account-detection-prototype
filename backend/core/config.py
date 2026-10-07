import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mule Account Detection API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Base directory
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    ROOT_DIR: Path = BASE_DIR.parent
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{Path(__file__).resolve().parent.parent / 'mule_detection.db'}")
    
    # ML Models directory
    MODELS_DIR: Path = Path(__file__).resolve().parent.parent / "models"
    
    # Risk Thresholds
    RISK_THRESHOLD_LOW: float = 30.0
    RISK_THRESHOLD_MEDIUM: float = 60.0
    RISK_THRESHOLD_HIGH: float = 80.0
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
