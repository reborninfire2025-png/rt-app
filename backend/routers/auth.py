from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models import UserCreate, UserLogin, Token
import jwt
import bcrypt
import os
from datetime import datetime, timedelta
from typing import Optional
import json

router = APIRouter()
security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "rt-enigma-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days

# In production, replace with PostgreSQL/MongoDB
# Simple in-memory store for demo - use a real DB in production
users_db = {}

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None or email not in users_db:
            raise HTTPException(status_code=401, detail="Invalid token")
        return users_db[email]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    if user_data.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = {
        "id": str(len(users_db) + 1),
        "email": user_data.email,
        "full_name": user_data.full_name,
        "credential_type": user_data.credential_type,
        "password_hash": hash_password(user_data.password),
        "subscription_tier": "free",
        "subscription_status": "active",
        "created_at": datetime.utcnow().isoformat(),
        "practice_stats": {"questions_answered": 0, "correct": 0, "streak": 0},
    }
    users_db[user_data.email] = user
    
    token = create_access_token({"sub": user_data.email})
    user_safe = {k: v for k, v in user.items() if k != "password_hash"}
    return Token(access_token=token, token_type="bearer", user=user_safe)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    user = users_db.get(credentials.email)
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": credentials.email})
    user_safe = {k: v for k, v in user.items() if k != "password_hash"}
    return Token(access_token=token, token_type="bearer", user=user_safe)

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password_hash"}

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}
