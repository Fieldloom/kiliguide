import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Database Configuration
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/postgres"
    
    # Ingestion Configuration
    INGESTION_INTERVAL_MINUTES: int = 30
    SITEMAP_URL: str = "https://www.dkut.ac.ke/sitemap.xml"
    
    # NVIDIA API Key
    NVIDIA_API_KEY: str = ""
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Supabase often provides postgresql:// user... but sometimes we need to ensure it works with SQLAlchemy
if settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1)
