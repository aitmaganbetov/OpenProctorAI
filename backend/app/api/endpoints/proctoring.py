# app/api/endpoints/proctoring.py
from fastapi import APIRouter, Depends, Form, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Violation, ExamSession, StudentProfile, User
from typing import Dict, Any
from datetime import datetime
import base64
import cv2
import numpy as np
import face_recognition

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

@router.post("/student/{student_id}/verify-photo")
def verify_student_photo(
    student_id: int,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Compare exam photo with stored profile photo for identity verification."""
    exam_photo = payload.get("exam_photo")  # Base64 encoded image from exam start
    
    if not exam_photo:
        return {"error": "exam_photo is required"}
    
    # Get stored profile photo
    profile = db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()
    
    if not profile or not profile.photo_base64:
        return {
            "verified": False,
            "confidence": 0.0,
            "message": "No profile photo on file for comparison"
        }
    
    try:
        # Convert base64 photos to images
        profile_image = base64_to_image(profile.photo_base64)
        exam_image = base64_to_image(exam_photo)
        
        # Extract face encodings
        profile_faces = face_recognition.face_encodings(profile_image)
        exam_faces = face_recognition.face_encodings(exam_image)
        
        if not profile_faces:
            return {
                "verified": False,
                "confidence": 0.0,
                "message": "No face detected in profile photo"
            }
        
        if not exam_faces:
            return {
                "verified": False,
                "confidence": 0.0,
                "message": "No face detected in exam photo"
            }
        
        # Compare faces (use first face from each photo)
        profile_encoding = profile_faces[0]
        exam_encoding = exam_faces[0]
        
        # Calculate distance between encodings (0 = identical, 1 = very different)
        distance = np.linalg.norm(profile_encoding - exam_encoding)
        
        # Convert distance to confidence (lower distance = higher confidence)
        # Threshold typically 0.6 for face_recognition library
        confidence = max(0, 1 - (distance / 0.6))
        confidence = min(1.0, confidence)  # Cap at 1.0
        
        # Verify if photos match (using standard threshold)
        threshold = 0.6
        verified = bool(distance < threshold)

        return {
            "verified": verified,
            "confidence": float(confidence),
            "distance": float(distance),
            "message": "Photo verification successful" if verified else "Photo does not match profile"
        }
    
    except Exception as e:
        return {
            "verified": False,
            "confidence": 0.0,
            "message": f"Error during photo comparison: {str(e)}"
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

def base64_to_image(base64_str: str) -> np.ndarray:
    """Convert base64 encoded image to numpy array."""
    # Remove data URL prefix if present
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    
    # Decode base64
    image_data = base64.b64decode(base64_str)
    
    # Convert to numpy array
    nparr = np.frombuffer(image_data, np.uint8)
    
    # Decode image
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert BGR to RGB for face_recognition
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    return image
