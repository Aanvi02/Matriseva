from datetime import datetime
from fastapi import HTTPException
from app.database import supabase

PATIENTS_TABLE = "patients"

async def create_patient(data: dict, current_user: dict) -> dict:
    data["asha_email"]    = current_user.get("email", "")
    data["asha_id"]       = current_user["id"]
    data["asha_name"]     = current_user.get("name", "")
    data["registered_at"] = datetime.utcnow().isoformat()
    data["visits"]        = data.get("visits", [])
    data["status"]        = "pending"

    # ✅ Patient khud register kare toh user_id save karo
    if current_user.get("role") == "patient":
        data["user_id"] = current_user["id"]

    # Auto assign doctor
    doc_res = supabase.table("users")\
        .select("id, name")\
        .eq("role", "doctor")\
        .limit(1)\
        .execute()
    if doc_res.data:
        data["doctor_id"]   = doc_res.data[0]["id"]
        data["doctor_name"] = doc_res.data[0]["name"]

    res = supabase.table(PATIENTS_TABLE).insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to register patient")
    return res.data[0]

async def get_patients(current_user: dict, risk: str = None, village: str = None) -> list:
    role  = current_user["role"]
    query = supabase.table(PATIENTS_TABLE).select("*")

    if role in ("asha", "asha_worker"):
        query = query.eq("asha_id", current_user["id"])
    elif role == "doctor":
        query = query.eq("doctor_id", current_user["id"])
    elif role == "patient":
        # Patient sirf apna data dekhe
        query = query.eq("user_id", current_user["id"])
    # admin sees all

    if risk:
        query = query.eq("risk", risk.upper())
    if village:
        query = query.ilike("village", f"%{village}%")

    res = query.order("registered_at", desc=True).execute()
    return res.data or []

async def get_patient_by_id(patient_id: str) -> dict:
    res = supabase.table(PATIENTS_TABLE)\
        .select("*")\
        .eq("id", patient_id)\
        .single()\
        .execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return res.data

async def update_patient(patient_id: str, data: dict) -> dict:
    data["updated_at"] = datetime.utcnow().isoformat()
    res = supabase.table(PATIENTS_TABLE)\
        .update(data)\
        .eq("id", patient_id)\
        .execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Patient not found or update failed")
    return res.data[0]

async def add_visit(patient_id: str, visit: dict) -> dict:
    res = supabase.table(PATIENTS_TABLE)\
        .select("visits")\
        .eq("id", patient_id)\
        .single()\
        .execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Patient not found")

    existing_visits      = res.data.get("visits") or []
    visit["recorded_at"] = datetime.utcnow().isoformat()
    updated_visits       = [visit] + existing_visits

    update_payload = {
        "visits":     updated_visits,
        "updated_at": datetime.utcnow().isoformat(),
    }
    for field in ("bp_sys", "bp_dia", "hb", "weight", "sugar"):
        if visit.get(field):
            update_payload[field] = visit[field]

    upd = supabase.table(PATIENTS_TABLE)\
        .update(update_payload)\
        .eq("id", patient_id)\
        .execute()
    return upd.data[0]

async def delete_patient(patient_id: str) -> dict:
    supabase.table(PATIENTS_TABLE).delete().eq("id", patient_id).execute()
    return {"message": "Patient deleted"}

async def assign_doctor(patient_id: str, data: dict) -> dict:
    payload = {
        "doctor_id":   data.get("doctor_id"),
        "doctor_name": data.get("doctor_name", ""),
        "updated_at":  datetime.utcnow().isoformat(),
    }
    res = supabase.table(PATIENTS_TABLE)\
        .update(payload)\
        .eq("id", patient_id)\
        .execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return res.data[0]