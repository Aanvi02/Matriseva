from fastapi import APIRouter
from app.models.user import UserRegister, UserLogin, Token
from app.services.auth_service import register_user, login_user

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user: UserRegister):
    result = await register_user(user.model_dump())
    return result

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    return await login_user(user.email, user.password)