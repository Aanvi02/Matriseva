from fastapi import APIRouter, Depends, HTTPException
from app.services.auth_service import get_current_user
from app.services.record_service import create_record, get_record_by_user

router = APIRouter()

@router.post("/create")
async def create_health_record(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    return create_record(data, current_user["id"])

@router.get("/me")
async def get_my_record(current_user: dict = Depends(get_current_user)):
    record = get_record_by_user(current_user["id"])
    if not record:
        raise HTTPException(status_code=404, detail="No record found")
    return record