from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional, Literal
from enum import Enum


class ScanMode(str, Enum):
    full = "full"
    bug_hunt = "bug_hunt"
    test_case_only = "test_case_only"


class ScanRequest(BaseModel):
    url: str
    requirements: Optional[str] = None
    mode: ScanMode = ScanMode.full
    roast_mode: bool = False

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        from services.url_validator import validate_scan_url
        return validate_scan_url(v)

    @field_validator("requirements")
    @classmethod
    def validate_requirements(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 2000:
            raise ValueError("Requirements must be under 2000 characters")
        return v


class ScanJobResponse(BaseModel):
    job_id: str
    status: str
    url: str
    created_at: str


class ScanStatusResponse(BaseModel):
    job_id: str
    status: str
    url: str
    progress_step: Optional[int] = None
    error_msg: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None
