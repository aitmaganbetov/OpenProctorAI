# app/api/endpoints/proctoring.py
from fastapi import APIRouter, Depends, Form, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Violation, ExamSession, StudentProfile, User
from typing import Dict, Any
from datetime import datetime

router = APIRouter(prefix="/proctoring", tags=["proctoring"])

@router.post("/report-violation")
async def report_violation(
    session_id: int = Form(...),
    violation_type: str = Form(...),
    timestamp: str = Form(...),
    confidence: float = Form(...),
    db: Session = Depends(get_db)
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=403, detail="Invalid session")

    violation = Violation(
        session_id=session.id,
        type=violation_type,
        confidence=confidence,
        severity_score=calculate_severity(violation_type)
    )
    db.add(violation)
    db.commit()
    db.refresh(violation)

    return {"status": "received", "violation_id": violation.id}

@router.post("/student/{student_id}/photo")
def upload_student_photo(
    student_id: int,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Upload and store student identification photo."""
    photo_data = payload.get("photo")  # Base64 encoded image
    
    if not photo_data:
        return {"error": "photo is required"}
    
    # Check if student exists
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        return {"error": "Student not found"}
    
    # Find or create student profile
    profile = db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()
    
    if not profile:
        profile = StudentProfile(student_id=student_id, photo_base64=photo_data, is_verified=True)
        db.add(profile)
    else:
        profile.photo_base64 = photo_data
        profile.is_verified = True
        profile.updated_at = datetime.now()
    
    db.commit()
    db.refresh(profile)
    
    return {
        "status": "success",
        "message": "Photo uploaded successfully",
        "student_id": student_id,
        "has_photo": True
    }

@router.get("/student/{student_id}/photo-status")
def check_student_photo(
    student_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Check if student has uploaded a photo for identification."""
    profile = db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()
    
    has_photo = profile is not None and profile.photo_base64 is not None
    
    return {
        "student_id": student_id,
        "has_photo": has_photo,
        "is_verified": profile.is_verified if profile else False
    }
def calculate_severity(v_type: str) -> int:
    mapping = {
        "gaze_away": 1,
        "tab_switch": 2,
        "voice_detected": 3,
        "face_missing": 4,
        "multiple_faces": 5
    }
    return mapping.get(v_type, 1)
