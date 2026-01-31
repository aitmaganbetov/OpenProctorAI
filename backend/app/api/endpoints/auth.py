# app/api/endpoints/auth.py
from fastapi import APIRouter, HTTPException, Body, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.database import get_db
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)) -> Dict[str, Any]:
    email = payload.get("email")
    password = payload.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password are required")

    user = db.query(User).filter(User.email == email).first()
    if not user or user.hashed_password != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
    }
