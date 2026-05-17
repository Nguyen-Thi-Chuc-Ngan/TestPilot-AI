import uuid
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import Response
from pydantic import BaseModel
from supabase import create_client, Client

from config import settings
from middleware.auth import get_current_user
from services.excel_parser_service import parse_file, export_to_excel
from services.testcase_ai_service import analyze_test_cases, generate_missing_cases

router = APIRouter()
_sb: Optional[Client] = None


def get_sb() -> Client:
    global _sb
    if _sb is None:
        _sb = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _sb


# ─── Upload ───────────────────────────────────────────────────────────────────
@router.post("/upload/debug-columns")
async def debug_columns(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Return raw column names to help diagnose mapping issues."""
    import openpyxl, io as _io
    content = await file.read()
    try:
        wb = openpyxl.load_workbook(_io.BytesIO(content), data_only=True)
        ws = wb.active
        headers = []
        for cell in ws[1]:
            headers.append({"col": cell.column, "value": repr(str(cell.value or ""))})
        return {"raw_headers_row1": headers, "total_cols": len(headers)}
    except Exception as e:
        return {"error": str(e)}


@router.post("/upload/preview")
async def preview_upload(
    file: UploadFile = File(...),
    suite_name: str = Form(...),
    user: dict = Depends(get_current_user),
):
    """Parse file and return preview — does NOT save to DB yet."""
    if not file.filename:
        raise HTTPException(400, "No file provided")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("xlsx", "xls", "csv"):
        raise HTTPException(400, f"Unsupported file type .{ext}. Only .xlsx and .csv allowed.")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(400, "File too large. Maximum 10MB.")

    result = parse_file(content, file.filename, suite_name)

    if result["errors"]:
        raise HTTPException(422, detail={"errors": result["errors"], "warnings": result["warnings"]})

    return {
        "preview": result["cases"][:20],  # first 20 rows for preview
        "total": result["total"],
        "warnings": result["warnings"],
        "column_map": result["column_map"],
        "filename": file.filename,
    }


@router.post("/upload/confirm")
async def confirm_upload(
    file: UploadFile = File(...),
    suite_name: str = Form(...),
    project_id: str = Form(None),
    module: str = Form(None),
    user: dict = Depends(get_current_user),
):
    """Parse and save to database."""
    content = await file.read()
    result = parse_file(content, file.filename or "upload", suite_name)

    if result["errors"]:
        raise HTTPException(422, detail={"errors": result["errors"]})

    sb = get_sb()
    suite_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    # Create suite
    sb.table("test_suites").insert({
        "id": suite_id,
        "user_id": user["user_id"],
        "project_id": project_id or None,
        "name": suite_name,
        "module": module or None,
        "original_file": file.filename,
        "total_cases": result["total"],
        "created_at": now,
        "updated_at": now,
    }).execute()

    # Insert test case rows in batches of 50
    cases = result["cases"]
    for i in range(0, len(cases), 50):
        batch = cases[i:i+50]
        rows = []
        for c in batch:
            rows.append({
                "id": str(uuid.uuid4()),
                "suite_id": suite_id,
                "user_id": user["user_id"],
                "tc_id": c.get("tc_id"),
                "module": c.get("module"),
                "feature": c.get("feature"),
                "requirement_id": c.get("requirement_id"),
                "test_type": c.get("test_type", "Functional"),
                "priority": c.get("priority", "Medium"),
                "severity": c.get("severity", "Minor"),
                "automation_status": c.get("automation_status", "Manual"),
                "precondition": c.get("precondition"),
                "description": c.get("description", ""),
                "steps": c.get("steps"),
                "test_data": c.get("test_data"),
                "expected_result": c.get("expected_result"),
                "actual_result": c.get("actual_result"),
                "status": c.get("status", "Not Run"),
                "bug_id": c.get("bug_id"),
                "environment": c.get("environment"),
                "browser": c.get("browser"),
                "dev_owner": c.get("dev_owner"),
                "dev_fixed": c.get("dev_fixed", False),
                "notes": c.get("notes"),
                "tags": c.get("tags", []),
                "row_order": c.get("row_order", 0),
                "created_at": now,
                "updated_at": now,
            })
        sb.table("test_case_rows").insert(rows).execute()

    return {
        "suite_id": suite_id,
        "total_imported": result["total"],
        "warnings": result["warnings"],
    }


# ─── Suites ───────────────────────────────────────────────────────────────────
@router.get("/suites")
async def list_suites(
    project_id: Optional[str] = Query(None),
    archived: bool = Query(False),
    user: dict = Depends(get_current_user),
):
    sb = get_sb()
    q = sb.table("test_suites").select("*").eq("user_id", user["user_id"])
    if project_id:
        q = q.eq("project_id", project_id)
    if archived:
        q = q.not_.is_("archived_at", "null")
    else:
        q = q.is_("archived_at", "null")
    result = q.order("created_at", desc=True).execute()
    return result.data or []


@router.get("/suites/{suite_id}")
async def get_suite(suite_id: str, user: dict = Depends(get_current_user)):
    sb = get_sb()
    suite = sb.table("test_suites").select("*").eq("id", suite_id).eq("user_id", user["user_id"]).single().execute()
    if not suite.data:
        raise HTTPException(404, "Suite not found")
    cases = sb.table("test_case_rows").select("*").eq("suite_id", suite_id).order("row_order").execute()
    return {"suite": suite.data, "cases": cases.data or []}


@router.delete("/suites/{suite_id}")
async def delete_suite(suite_id: str, user: dict = Depends(get_current_user)):
    sb = get_sb()
    sb.table("test_suites").delete().eq("id", suite_id).eq("user_id", user["user_id"]).execute()
    return {"ok": True}


@router.patch("/suites/{suite_id}/archive")
async def archive_suite(suite_id: str, user: dict = Depends(get_current_user)):
    sb = get_sb()
    sb.table("test_suites").update({"archived_at": datetime.utcnow().isoformat()}).eq("id", suite_id).eq("user_id", user["user_id"]).execute()
    return {"ok": True}


# ─── Individual case updates ──────────────────────────────────────────────────
class CaseUpdate(BaseModel):
    status: Optional[str] = None
    actual_result: Optional[str] = None
    bug_id: Optional[str] = None
    notes: Optional[str] = None
    executed_by: Optional[str] = None
    execution_date: Optional[str] = None
    dev_fixed: Optional[bool] = None
    priority: Optional[str] = None


@router.patch("/{case_id}")
async def update_case(case_id: str, body: CaseUpdate, user: dict = Depends(get_current_user)):
    sb = get_sb()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    data["updated_at"] = datetime.utcnow().isoformat()
    sb.table("test_case_rows").update(data).eq("id", case_id).eq("user_id", user["user_id"]).execute()
    return {"ok": True}


@router.delete("/{case_id}")
async def delete_case(case_id: str, user: dict = Depends(get_current_user)):
    sb = get_sb()
    sb.table("test_case_rows").delete().eq("id", case_id).eq("user_id", user["user_id"]).execute()
    return {"ok": True}


# ─── AI Analysis ─────────────────────────────────────────────────────────────
@router.post("/suites/{suite_id}/analyze")
async def ai_analyze(suite_id: str, user: dict = Depends(get_current_user)):
    sb = get_sb()
    suite = sb.table("test_suites").select("*").eq("id", suite_id).eq("user_id", user["user_id"]).single().execute()
    if not suite.data:
        raise HTTPException(404, "Suite not found")

    cases_res = sb.table("test_case_rows").select("*").eq("suite_id", suite_id).execute()
    cases = cases_res.data or []

    if not cases:
        raise HTTPException(400, "No test cases in this suite to analyze")

    try:
        analysis = await analyze_test_cases(cases, suite.data.get("module", ""), suite.data.get("name", ""))
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {e}")

    # Cache result
    sb.table("tc_ai_analysis").insert({
        "id": str(uuid.uuid4()),
        "suite_id": suite_id,
        "user_id": user["user_id"],
        "result": analysis,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()

    return analysis


@router.post("/suites/{suite_id}/generate-missing")
async def ai_generate_missing(suite_id: str, user: dict = Depends(get_current_user)):
    sb = get_sb()
    suite = sb.table("test_suites").select("*").eq("id", suite_id).eq("user_id", user["user_id"]).single().execute()
    if not suite.data:
        raise HTTPException(404, "Suite not found")

    cases_res = sb.table("test_case_rows").select("*").eq("suite_id", suite_id).execute()
    cases = cases_res.data or []

    try:
        new_cases = await generate_missing_cases(cases, suite.data.get("module", ""), suite.data.get("name", ""))
    except Exception as e:
        raise HTTPException(500, f"AI generation failed: {e}")

    # Insert generated cases
    now = datetime.utcnow().isoformat()
    rows = []
    for c in new_cases:
        rows.append({
            "id": str(uuid.uuid4()),
            "suite_id": suite_id,
            "user_id": user["user_id"],
            "tc_id": c.get("tc_id"),
            "test_type": c.get("test_type", "Functional"),
            "priority": c.get("priority", "Medium"),
            "severity": c.get("severity", "Minor"),
            "automation_status": c.get("automation_status", "Manual"),
            "precondition": c.get("precondition"),
            "description": c.get("description", ""),
            "steps": c.get("steps"),
            "test_data": c.get("test_data"),
            "expected_result": c.get("expected_result"),
            "status": "Not Run",
            "tags": c.get("tags", []) + ["ai-generated"],
            "ai_suggestions": "Generated by AI to fill coverage gap",
            "created_at": now,
            "updated_at": now,
            "row_order": 9999,
        })
    if rows:
        sb.table("test_case_rows").insert(rows).execute()

    return {"generated": len(rows), "cases": new_cases}


# ─── Export ───────────────────────────────────────────────────────────────────
@router.post("/suites/{suite_id}/export")
async def export_suite(suite_id: str, user: dict = Depends(get_current_user)):
    sb = get_sb()
    suite = sb.table("test_suites").select("*").eq("id", suite_id).eq("user_id", user["user_id"]).single().execute()
    if not suite.data:
        raise HTTPException(404, "Suite not found")

    cases_res = sb.table("test_case_rows").select("*").eq("suite_id", suite_id).order("row_order").execute()
    cases = cases_res.data or []

    excel_bytes = export_to_excel(cases, suite.data["name"])
    filename = f"{suite.data['name'].replace(' ', '_')}_export.xlsx"

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
