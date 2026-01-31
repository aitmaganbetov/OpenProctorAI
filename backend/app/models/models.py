# app/models/models.py
"""SQLAlchemy ORM models for the proctoring system."""
import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, Index, Integer, JSON, String, Text
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class UserRole(str, enum.Enum):
    """User role enumeration."""
    STUDENT = "student"
    TEACHER = "teacher"
    PROCTOR = "proctor"
    ADMIN = "admin"


class ViolationType(str, enum.Enum):
    """Types of proctoring violations."""
    GAZE_AWAY = "gaze_away"
    FACE_MISSING = "face_missing"
    MULTIPLE_FACES = "multiple_faces"
    VOICE_DETECTED = "voice_detected"
    TAB_SWITCH = "tab_switch"
    UNAUTHORIZED_OBJECT = "object_detected"


class User(Base):
    """User account model."""
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email_role", "email", "role"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STUDENT)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    face_embedding_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    profile: Mapped[Optional["StudentProfile"]] = relationship(
        "StudentProfile", back_populates="student", uselist=False, lazy="selectin"
    )
    sessions: Mapped[List["ExamSession"]] = relationship(
        "ExamSession", back_populates="student", foreign_keys="ExamSession.student_id"
    )


class StudentProfile(Base):
    """Student profile with verification photo."""
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    photo_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    photo_base64: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    student: Mapped["User"] = relationship("User", back_populates="profile")


class Exam(Base):
    """Exam definition model."""
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, default=60)
    config: Mapped[dict] = mapped_column(
        JSON, default={"strictness": "medium", "allow_tab_switch": False, "record_audio": True}
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    sessions: Mapped[List["ExamSession"]] = relationship("ExamSession", back_populates="exam")
    assignments: Mapped[List["ExamAssignment"]] = relationship("ExamAssignment", back_populates="exam")


class ExamSession(Base):
    """Active exam session for a student."""
    __tablename__ = "exam_sessions"
    __table_args__ = (
        Index("ix_exam_sessions_status_start", "status", "start_time"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    exam_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exams.id", ondelete="CASCADE"), index=True
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, completed, failed
    verdict: Mapped[str] = mapped_column(String(50), default="pending")
    ai_summary: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    exam: Mapped["Exam"] = relationship("Exam", back_populates="sessions")
    student: Mapped["User"] = relationship(
        "User", back_populates="sessions", foreign_keys=[student_id]
    )
    violations: Mapped[List["Violation"]] = relationship(
        "Violation", back_populates="session", cascade="all, delete-orphan", lazy="selectin"
    )


class Violation(Base):
    """Proctoring violation event."""
    __tablename__ = "violations"
    __table_args__ = (
        Index("ix_violations_session_type", "session_id", "type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exam_sessions.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    severity_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    video_proof_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    video_duration: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    snapshot_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Relationships
    session: Mapped["ExamSession"] = relationship("ExamSession", back_populates="violations")


class AuditLog(Base):
    """Audit log for tracking system events."""
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(255), index=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class ExamAssignment(Base):
    """Assignment of exam to student."""
    __tablename__ = "exam_assignments"
    __table_args__ = (
        Index("ix_assignments_exam_student", "exam_id", "student_id", unique=True),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    exam_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exams.id", ondelete="CASCADE"), index=True, nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="assigned")

    # Relationships
    exam: Mapped["Exam"] = relationship("Exam", back_populates="assignments")
    student: Mapped["User"] = relationship("User")
