from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://uta:secret@localhost:5432/uta_db"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # API
    api_title: str = "Urban Transport Analytics API"
    api_version: str = "1.0.0"
    api_description: str = "Analytics microservice for urban transport data"
    
    # Machine Learning
    model_retrain_schedule: str = "0 2 * * *"  # Daily at 2 AM
    min_samples_for_training: int = 500
    model_path: str = "models/ml_models"
    
    # Cache TTL (seconds)
    cache_ttl_predictions: int = 300  # 5 minutes
    cache_ttl_analysis: int = 600     # 10 minutes
    cache_ttl_stats: int = 120        # 2 minutes
    
    # Rate limiting
    rate_limit_per_minute: int = 60
    
    # Environment
    environment: str = "development"
    debug: bool = False
    
    # CORS
    cors_origins: list = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Create global settings instance
settings = Settings()

# Ensure model directory exists
os.makedirs(settings.model_path, exist_ok=True)
