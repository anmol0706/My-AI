from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # Application settings
    app_name: str = "My-AI"
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", "8000"))

    # API Keys
    gemini_api_key: str
    huggingface_api_key: str

    # CORS settings - Allow all origins for production deployment
    allowed_origins: List[str] = ["*"]
    
    # API settings
    max_tokens: int = 1000
    temperature: float = 0.7
    request_timeout: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Create settings instance
settings = Settings()
