from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class Role(str, Enum):
    patient = "patient"
    doctor = "doctor"
    asha_worker = "asha_worker"
    admin = "admin"

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: Role
    phone: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut