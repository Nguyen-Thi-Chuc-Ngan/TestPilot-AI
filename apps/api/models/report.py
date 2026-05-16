from pydantic import BaseModel
from typing import Optional, List, Literal


class Finding(BaseModel):
    id: str
    category: str
    title: str
    description: str
    severity: Literal["critical", "high", "medium", "low", "info"]
    element_hint: Optional[str] = None
    recommendation: Optional[str] = None
    roast_comment: Optional[str] = None


class AIFindingsResponse(BaseModel):
    findings: List[Finding]
    overall_score: int
    summary: str


class TestStep(BaseModel):
    step: int
    action: str
    expected: str


class TestCase(BaseModel):
    id: str
    case_id: str
    title: str
    category: str
    priority: Literal["high", "medium", "low"]
    preconditions: List[str] = []
    steps: List[TestStep]
    expected_result: str
    test_data: Optional[str] = None


class AITestCasesResponse(BaseModel):
    test_cases: List[TestCase]


class BugReport(BaseModel):
    title: str
    environment: str
    severity: Literal["critical", "high", "medium", "low"]
    priority: Literal["P1", "P2", "P3", "P4"]
    steps_to_reproduce: List[str]
    expected_result: str
    actual_result: str
    impact: str
    suggested_fix: Optional[str] = None
