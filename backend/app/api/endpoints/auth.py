# app/api/endpoints/auth.py
"""Authentication endpoints."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User, AuditLog

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    """Login request schema."""
    email: str
    password: str


class LoginResponse(BaseModel):
    """Login response schema."""
    id: int
    email: str
    full_name: str | None
    role: str


def _log_auth_event(
    db: Session,
    user_id: int | None,
    action: str,
    details: dict[str, Any],
) -> None:
    """Log authentication events to audit log."""
    db.add(AuditLog(user_id=user_id, action=action, details=details))


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """Authenticate user and return user info.
    
    Note: In production, use proper password hashing (bcrypt/argon2).
    """
    user = db.query(User).filter(User.email == payload.email).first()

    # TODO: Replace plain password comparison with proper hash verification
    # Example: if not verify_password(payload.password, user.hashed_password):
    if not user or user.hashed_password != payload.password:
        _log_auth_event(
            db,
            user_id=user.id if user else None,
            action="auth.failed",
            details={"email": payload.email},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    _log_auth_event(
        db,
        user_id=user.id,
        action="auth.login",
        details={"email": user.email, "role": user.role.value},
    )
    db.commit()

    return LoginResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
    )
