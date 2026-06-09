from fastapi import APIRouter, Depends
from app.services.auth_service import get_current_user
from app.services.predict_service import predict_risk

router = APIRouter()

@router.post("/predict")
async def predict(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    return await predict_risk(data)