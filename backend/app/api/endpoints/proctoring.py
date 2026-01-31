# app/api/endpoints/proctoring.py
from fastapi import APIRouter, Depends, Form, HTTPException, Body, Request, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Violation, ExamSession, StudentProfile, User, Exam
from app.core.config import settings
from typing import Dict, Any, Set
from datetime import datetime
import base64
import cv2
import numpy as np
import face_recognition
from minio import Minio
from minio.error import S3Error
from uuid import uuid4
import io
import tempfile
import subprocess

router = APIRouter(prefix="/proctoring", tags=["proctoring"])

def get_video_duration(video_bytes: bytes) -> float:
    """Get video duration using ffprobe"""
    try:
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=True) as tmp:
            tmp.write(video_bytes)
            tmp.flush()
            result = subprocess.run(
                ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                 '-of', 'default=noprint_wrappers=1:nokey=1', tmp.name],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0 and result.stdout.strip():
                return float(result.stdout.strip())
    except Exception as e:
        print(f"Error getting video duration: {e}")
    return None

rooms: Dict[str, Set[WebSocket]] = {}

def get_minio_client() -> Minio:
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )

def ensure_bucket(client: Minio, bucket: str) -> None:
    found = client.bucket_exists(bucket)
    if not found:
        client.make_bucket(bucket)

def build_public_url(object_name: str) -> str:
    if settings.MINIO_PUBLIC_URL:
        return f"{settings.MINIO_PUBLIC_URL.rstrip('/')}/{settings.MINIO_BUCKET}/{object_name}"
    scheme = "https" if settings.MINIO_SECURE else "http"
    return f"{scheme}://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET}/{object_name}"

@router.websocket("/ws/stream/{room_id}")
async def stream_signaling(websocket: WebSocket, room_id: str):
    await websocket.accept()
    room = rooms.setdefault(room_id, set())
    room.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            for conn in list(room):
                if conn is not websocket:
                    await conn.send_text(data)
    except WebSocketDisconnect:
        room.remove(websocket)
        if not room:
            rooms.pop(room_id, None)

@router.post("/report-violation")
async def report_violation(
    session_id: int = Form(None),
    violation_type: str = Form(None),
    timestamp: str = Form(None),
    confidence: float = Form(None),
    payload: Dict[str, Any] = Body(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    if payload is None and request is not None:
        try:
            payload = await request.json()
        except Exception:
            payload = None

    if payload:
        session_id = session_id or payload.get("session_id")
        student_id = payload.get("student_id")
        exam_id = payload.get("exam_id")
        violation_type = violation_type or payload.get("violation_type")
        timestamp = timestamp or payload.get("timestamp")
        confidence = confidence if confidence is not None else payload.get("confidence")

    else:
        student_id = None
        exam_id = None

    session_id = resolve_session_id(db, session_id, student_id, exam_id)

    if session_id is None or violation_type is None or timestamp is None or confidence is None:
        raise HTTPException(status_code=400, detail="Missing required fields")
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


@router.post("/report-violation-evidence")
async def report_violation_evidence(
    file: UploadFile = File(...),
    session_id: int = Form(None),
    student_id: int = Form(None),
    exam_id: int = Form(None),
    violation_type: str = Form(None),
    timestamp: str = Form(None),
    confidence: float = Form(None),
    db: Session = Depends(get_db),
):
    session_id = resolve_session_id(db, session_id, student_id, exam_id)
    if session_id is None or violation_type is None or timestamp is None or confidence is None:
        raise HTTPException(status_code=400, detail="Missing required fields")
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=403, detail="Invalid session")

    client = get_minio_client()
    try:
        ensure_bucket(client, settings.MINIO_BUCKET)
    except S3Error:
        raise HTTPException(status_code=500, detail="MinIO bucket error")

    contents = await file.read()
    
    # Get video duration
    video_duration = get_video_duration(contents)
    
    object_name = f"violations/{session_id}/{uuid4().hex}.webm"
    client.put_object(
        settings.MINIO_BUCKET,
        object_name,
        io.BytesIO(contents),
        length=len(contents),
        content_type=file.content_type or "video/webm",
    )
    public_url = build_public_url(object_name)

    violation = Violation(
        session_id=session.id,
        type=violation_type,
        confidence=confidence,
        severity_score=calculate_severity(violation_type),
        video_proof_url=public_url,
        video_duration=video_duration,
    )
    db.add(violation)
    db.commit()
    db.refresh(violation)

    return {"status": "received", "violation_id": violation.id, "video_url": public_url, "video_duration": video_duration}

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


@router.get("/student/{student_id}/profile")
def get_student_profile(
    student_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()

    photo_base64 = None
    if profile and profile.photo_base64:
        raw = profile.photo_base64
        if isinstance(raw, str):
            if raw.startswith("data:"):
                photo_base64 = raw
            else:
                # Best-effort MIME detection for common image types
                mime = "image/jpeg"
                if raw.startswith("iVBOR"):
                    mime = "image/png"
                elif raw.startswith("R0lG"):
                    mime = "image/gif"
                photo_base64 = f"data:{mime};base64,{raw}"

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "photo_base64": photo_base64,
        "is_verified": profile.is_verified if profile else False,
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
        "multiple_faces": 5,
        "face_substitution": 5,
        "phone_detected": 4,
        "book_detected": 3,
        "laptop_detected": 3,
    }
    return mapping.get(v_type, 1)

def resolve_session_id(
    db: Session,
    session_id: Any,
    student_id: Any,
    exam_id: Any,
) -> int:
    if session_id in ("", 0, "0"):
        session_id = None
    if isinstance(session_id, str) and session_id.isdigit():
        session_id = int(session_id)

    if session_id is None and student_id is not None:
        session = (
            db.query(ExamSession)
            .filter(ExamSession.student_id == student_id)
            .order_by(ExamSession.start_time.desc())
            .first()
        )
        if not session:
            exam = None
            if exam_id is not None:
                exam = db.query(Exam).filter(Exam.id == exam_id).first()
            if not exam:
                exam = db.query(Exam).first()
            session = ExamSession(exam_id=exam.id if exam else None, student_id=student_id, status="active")
            db.add(session)
            db.commit()
            db.refresh(session)
        if session:
            session_id = session.id
    return session_id

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

@router.get("/video-proxy")
async def video_proxy(url: str):
    """Proxy video requests to MinIO with CORS headers"""
    import httpx
    
    # Validate that URL is from our MinIO
    allowed_hosts = [
        "http://localhost:9000",
        "http://127.0.0.1:9000",
        "http://minio:9000",
        f"http://{settings.MINIO_ENDPOINT}",
    ]
    if not any(url.startswith(h) for h in allowed_hosts):
        raise HTTPException(status_code=400, detail="Invalid URL")
    
    # Convert localhost URL to internal minio URL for Docker network
    internal_url = url.replace("http://localhost:9000", "http://minio:9000")
    internal_url = internal_url.replace("http://127.0.0.1:9000", "http://minio:9000")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(internal_url, timeout=30.0)
            
            headers = {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Content-Type": response.headers.get("Content-Type", "video/webm"),
                "Content-Length": response.headers.get("Content-Length", "0"),
                "Accept-Ranges": "bytes",
            }
            
            return StreamingResponse(
                iter([response.content]),
                headers=headers,
                media_type=response.headers.get("Content-Type", "video/webm")
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error proxying video: {str(e)}")
