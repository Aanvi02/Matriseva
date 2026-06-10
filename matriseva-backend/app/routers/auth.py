# app/routers/auth.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.services.auth_service import register_user, login_user, get_current_user
from app.database import supabase

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    phone: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(req: RegisterRequest):
    return await register_user(req.dict())

@router.post("/login")
async def login(req: LoginRequest):
    return await login_user(req.email, req.password)

@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return current_user

# ASHA ke liye doctors list
@router.get("/doctors")
async def get_doctors(current_user: dict = Depends(get_current_user)):
    res = supabase.table("users")\
        .select("id, name, email, phone")\
        .eq("role", "doctor")\
        .execute()
    return res.data or []