from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # AI
    gemini_api_key: str = ""

    # App
    environment: str = "development"
    log_level: str = "info"
    api_secret_key: str = "change-me-in-production"

    # Storage buckets
    storage_bucket_screenshots: str = "screenshots"
    storage_bucket_reports: str = "reports"

    # Rate limiting
    max_scans_per_hour: int = 5
    max_scans_per_day: int = 20

    # Playwright
    playwright_timeout_ms: int = 30000
    max_concurrent_scans: int = 3

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "https://*.vercel.app"]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
