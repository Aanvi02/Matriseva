from fastapi import APIRouter, Depends
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("/")
async def get_appointments(current_user: dict = Depends(get_current_user)):
    return {"message": "Appointments endpoint", "user": current_user}