from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from app.services.auth_service import get_current_user
from app.services.patients_service import (
    create_patient, get_patients, get_patient_by_id,
    update_patient, add_visit, delete_patient, assign_doctor,
)

router = APIRouter()

def require_role(*roles):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return current_user
    return role_checker


# ✅ FIX — /patients/me endpoint
# Patient portal iss se profile fetch karega (patients table se)
# IMPORTANT: yeh route /{patient_id} se PEHLE hona chahiye
# warna FastAPI "me" ko patient_id samajh leta hai
@router.get("/me")
async def get_my_patient_profile(current_user: dict = Depends(get_current_user)):
    from app.database import supabase

    # Patient ki apni profile — user_id se match karo
    res = supabase.table("patients")\
        .select("*")\
        .eq("user_id", current_user["id"])\
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    return res.data[0]


@router.post("/")
async def register_patient(
    data: dict,
    current_user: dict = Depends(require_role("asha_worker", "asha", "doctor", "admin", "patient"))
):
    return await create_patient(data, current_user)


@router.get("/")
async def list_patients(
    risk: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    return await get_patients(current_user, risk, village)


# NOTE: /me endpoint upar hai, yahan /{patient_id} baad mein
@router.get("/{patient_id}")
async def get_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    return await get_patient_by_id(patient_id)


@router.patch("/{patient_id}")
async def patch_patient(patient_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    return await update_patient(patient_id, data)


@router.post("/{patient_id}/visits")
async def record_visit(patient_id: str, visit: dict, current_user: dict = Depends(get_current_user)):
    return await add_visit(patient_id, visit)


@router.delete("/{patient_id}")
async def remove_patient(
    patient_id: str,
    current_user: dict = Depends(require_role("admin"))
):
    return await delete_patient(patient_id)


@router.patch("/{patient_id}/assign-doctor")
async def assign_doctor_route(
    patient_id: str,
    data: dict,
    current_user: dict = Depends(require_role("asha_worker", "asha", "doctor", "admin"))
):
    return await assign_doctor(patient_id, data)