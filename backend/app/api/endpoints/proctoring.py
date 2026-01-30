# app/api/endpoints/proctoring.py
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Violation, ExamSession

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

def calculate_severity(v_type: str) -> int:
    mapping = {
        "gaze_away": 1,
        "tab_switch": 2,
        "voice_detected": 3,
        "face_missing": 4,
        "multiple_faces": 5
    }
    return mapping.get(v_type, 1)
