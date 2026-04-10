from datetime import datetime, timedelta
import hashlib
import base64

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer

from app.database import supabase, USERS_TABLE
from app.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 token scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _prepare_password(password: str) -> str:
    return base64.b64encode(hashlib.sha256(password.encode()).digest()).decode()


def hash_password(password: str) -> str:
    return pwd_context.hash(_prepare_password(password))


def verify_password(plain: str, hashed: str) -> bool:
    try:
        if pwd_context.verify(_prepare_password(plain), hashed):
            return True
    except Exception:
        pass
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# 🔐 REGISTER USER
async def register_user(user_data: dict) -> dict:
    user_data["email"] = user_data["email"].lower().strip()

    res = supabase.table(USERS_TABLE) \
        .select("id") \
        .eq("email", user_data["email"]) \
        .execute()

    if res.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_data["password"] = hash_password(user_data["password"])
    user_data["created_at"] = datetime.utcnow().isoformat()

    insert_res = supabase.table(USERS_TABLE).insert(user_data).execute()

    if not insert_res.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user = insert_res.data[0]

    token = create_access_token({
        "sub": user["id"],
        "role": user["role"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id":    user["id"],
            "name":  user["name"],
            "email": user["email"],
            "role":  user["role"],
            "phone": user.get("phone")
        }
    }


# 🔑 LOGIN USER
async def login_user(email: str, password: str) -> dict:
    email = email.lower().strip()

    res = supabase.table(USERS_TABLE) \
        .select("*") \
        .eq("email", email) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = res.data[0]

    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({
        "sub": user["id"],
        "role": user["role"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id":    user["id"],
            "name":  user["name"],
            "email": user["email"],
            "role":  user["role"],
            "phone": user.get("phone")
        }
    }


# 👤 GET CURRENT USER
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    res = supabase.table(USERS_TABLE) \
        .select("id, name, email, role, phone") \
        .eq("id", user_id) \
        .execute()

    if not res.data:
        raise credentials_exception

    user = res.data[0]

    return {
        "id":   user["id"],
        "name": user["name"],
        "role": role
    }


# 🔐 ROLE CHECK
def require_role(*roles):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return current_user
    return role_checker