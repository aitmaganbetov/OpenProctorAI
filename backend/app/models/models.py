# app/models/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    PROCTOR = "proctor"
    ADMIN = "admin"

class ViolationType(str, enum.Enum):
    GAZE_AWAY = "gaze_away"
    FACE_MISSING = "face_missing"
    MULTIPLE_FACES = "multiple_faces"
    VOICE_DETECTED = "voice_detected"
    TAB_SWITCH = "tab_switch"
    UNAUTHORIZED_OBJECT = "object_detected"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True)
    face_embedding_path = Column(String(512), nullable=True)

class Exam(Base):
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    duration_minutes = Column(Integer)
    config = Column(JSON, default={"strictness": "medium", "allow_tab_switch": False, "record_audio": True})
    is_active = Column(Boolean, default=True)

class ExamSession(Base):
    __tablename__ = "exam_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="active")  # active, completed, failed
    verdict = Column(String(50), default="pending")
    ai_summary = Column(JSON, nullable=True)
    
    violations = relationship("Violation", back_populates="session")

class Violation(Base):
    __tablename__ = "violations"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id"), index=True)
    type = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    severity_score = Column(Integer)
    confidence = Column(Float)
    video_proof_url = Column(String(512), nullable=True)
    snapshot_url = Column(String(512), nullable=True)
    
    session = relationship("ExamSession", back_populates="violations")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(255))
    details = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ExamAssignment(Base):
    __tablename__ = "exam_assignments"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="assigned")

    # relationships omitted for brevity; can be added later if needed
