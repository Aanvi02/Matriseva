from fastapi import APIRouter, Depends, HTTPException
from app.services.auth_service import get_current_user
from app.database import supabase
from datetime import datetime

router = APIRouter()

APPOINTMENTS_TABLE = "appointments"

def require_role(*roles):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return current_user
    return role_checker

@router.get("/")
async def get_appointments(current_user: dict = Depends(get_current_user)):
    role  = current_user["role"]
    query = supabase.table(APPOINTMENTS_TABLE).select("*")

    if role == "doctor":
        query = query.eq("doctor_id", current_user["id"])
    elif role in ("asha", "asha_worker"):
        query = query.eq("asha_id", current_user["id"])
    elif role == "patient":
        query = query.eq("patient_id", current_user["id"])
    # admin sees all

    res = query.order("date", desc=False).execute()
    return res.data or []

@router.post("/")
async def create_appointment(
    data: dict,
    # ✅ patient role add kiya
    current_user: dict = Depends(require_role("asha", "asha_worker", "doctor", "admin", "patient"))
):
    data["created_at"] = datetime.utcnow().isoformat()

    # ASHA se auto-fill
    if current_user["role"] in ("asha", "asha_worker"):
        data["asha_id"]   = current_user["id"]
        data["asha_name"] = current_user.get("name", "")

    # ✅ Patient khud book kare toh patient_id auto-fill
    if current_user["role"] == "patient":
        data["patient_id"] = current_user["id"]

    res = supabase.table(APPOINTMENTS_TABLE).insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create appointment")
    return res.data[0]

@router.patch("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    data["updated_at"] = datetime.utcnow().isoformat()
    res = supabase.table(APPOINTMENTS_TABLE)\
        .update(data)\
        .eq("id", appointment_id)\
        .execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return res.data[0]

@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    current_user: dict = Depends(require_role("admin", "doctor"))
):
    supabase.table(APPOINTMENTS_TABLE).delete().eq("id", appointment_id).execute()
    return {"message": "Appointment deleted"}