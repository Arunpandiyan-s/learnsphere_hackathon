import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Dynamically resolve absolute path to backend/.env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    DATABASE_URL: str
    NEON_AUTH_URL: str
    NEON_AUTH_AUDIENCE: str
    NEON_AUTH_ISSUER: str
    QUBRID_API_KEY: str
    QUBRID_BASE_URL: str = "https://platform.qubrid.com/api/v1/qubridai"

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "LearnSphere LMS Backend"

    model_config = SettingsConfigDict(
        env_file=ENV_PATH, 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()
