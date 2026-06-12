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
    
    gemini_api_key: str 
    class Config:
        env_file = ".env"  

# Create settings instance
settings = Settings()