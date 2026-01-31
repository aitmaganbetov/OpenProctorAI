from datetime import datetime
import platform
import psutil
from typing import Any, Dict, List

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User, UserRole, AuditLog

router = APIRouter(prefix="/admin", tags=["admin"])


def _normalize_role(role_value: str | None) -> UserRole:
    if not role_value:
        return UserRole.STUDENT
    role = role_value.lower()
    if role == "admin":
        return UserRole.ADMIN
    if role == "teacher":
        return UserRole.TEACHER
    if role == "proctor":
        return UserRole.PROCTOR
    return UserRole.STUDENT


def _add_audit_log(db: Session, action: str, user_id: int | None = None, details: Dict[str, Any] | None = None) -> None:
    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            details=details or {},
        )
    )


@router.get("/users")
def list_users(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    users = db.query(User).order_by(User.id.desc()).all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": datetime.now().isoformat(),
        }
        for user in users
    ]


@router.post("/users")
def create_user(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)) -> Dict[str, Any]:
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="email is required")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")

    full_name = payload.get("full_name") or payload.get("name")
    password = payload.get("password") or "demo_password"
    role = _normalize_role(payload.get("role"))

    user = User(
        email=email,
        full_name=full_name,
        hashed_password=password,
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _add_audit_log(
        db,
        action="user.created",
        user_id=user.id,
        details={"email": user.email, "role": user.role.value},
    )
    db.commit()

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
    }


@router.patch("/users/{user_id}/toggle")
def toggle_user_status(user_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.add(user)
    db.commit()
    db.refresh(user)

    _add_audit_log(
        db,
        action="user.toggled",
        user_id=user.id,
        details={"email": user.email, "is_active": user.is_active},
    )
    db.commit()

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
    }


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    _add_audit_log(
        db,
        action="user.deleted",
        user_id=user.id,
        details={"email": user.email, "role": user.role.value},
    )
    db.commit()
    db.delete(user)
    db.commit()
    return {"status": "deleted", "id": user_id}


@router.get("/logs")
def list_audit_logs(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(50).all()
    results: List[Dict[str, Any]] = []
    for log in logs:
        user_email = None
        if log.user_id:
            user = db.query(User).filter(User.id == log.user_id).first()
            user_email = getattr(user, "email", None)
        results.append(
            {
                "id": log.id,
                "user_email": user_email,
                "action": log.action,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
        )
    return results


@router.get("/server-status")
def server_status() -> Dict[str, Any]:
    cpu_percent = psutil.cpu_percent(interval=0.2)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()

    return {
        "os": platform.platform(),
        "cpu_percent": round(cpu_percent, 1),
        "memory_percent": round(memory.percent, 1),
        "memory_used_gb": round(memory.used / (1024 ** 3), 2),
        "memory_total_gb": round(memory.total / (1024 ** 3), 2),
        "disk_percent": round(disk.percent, 1),
        "disk_used_gb": round(disk.used / (1024 ** 3), 2),
        "disk_total_gb": round(disk.total / (1024 ** 3), 2),
        "net_sent_mb": round(net.bytes_sent / (1024 ** 2), 2),
        "net_recv_mb": round(net.bytes_recv / (1024 ** 2), 2),
        "timestamp": datetime.now().isoformat(),
    }
