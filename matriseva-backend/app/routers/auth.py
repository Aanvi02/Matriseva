# app/routers/auth.py
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from app.services.auth_service import register_user, login_user, get_current_user

router = APIRouter()


# Request models
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    phone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Routes
@router.post("/register")
async def register(req: RegisterRequest):
    try:
        return await register_user(req.dict())
    except HTTPException as e:
        raise e


@router.post("/login")
async def login(req: LoginRequest):
    try:
        return await login_user(req.email, req.password)
    except HTTPException as e:
        raise e


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return current_user