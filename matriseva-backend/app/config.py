# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # JWT / Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SECRET_KEY: str

    class Config:
        env_file = ".env"  # make sure .env is in project root

# Create settings instance
settings = Settings()