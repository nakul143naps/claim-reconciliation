"""Application configuration management using Pydantic Settings."""

from pathlib import Path
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Configuration settings loaded from environment or .env file."""

    DATABASE_URL: str = Field(
        default="mysql+pymysql://stitch_user:stitch_password@localhost:3306/claim_reconciliation",
        description="Database connection URL",
    )
    API_HOST: str = Field(default="0.0.0.0", description="Host to bind the API server")
    API_PORT: int = Field(default=8000, description="Port to bind the API server")
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "https://claim-reconciliation.duckdns.org",
            "http://67.202.41.44",
        ],
        description="Allowed CORS origins",
    )
    ADMIN_API_KEY: str = Field(
        default="reconcile-admin-secret-2026",
        description="Secret key required for administrative and destructive operations",
    )
    ENVIRONMENT: str = Field(default="development", description="Application environment")

    model_config = SettingsConfigDict(
        env_file=(str(_ROOT_DIR / ".env"), str(_BACKEND_DIR / ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
