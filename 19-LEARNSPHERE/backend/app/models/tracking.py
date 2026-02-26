import uuid
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.db.base_class import Base

class LearningSession(Base):
    __tablename__ = "learning_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), index=True, nullable=True)
    
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, default=0)

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), index=True, nullable=False) # Assuming quiz is a type of lesson
    
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, default=0)
    attempt_number = Column(Integer, default=1)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserActivityLog(Base):
    __tablename__ = "user_activity_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    activity_type = Column(String(255), nullable=False)
    metadata_json = Column(JSONB, default={}) # Named metadata_json because metadata is reserved in SQLAlchemy Base
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PerformanceAnalysis(Base):
    __tablename__ = "performance_analysis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, unique=True, nullable=False)
    
    total_learning_time = Column(Integer, default=0) # in seconds
    average_score = Column(Float, default=0.0)
    completion_percentage = Column(Float, default=0.0)
    weak_topics = Column(JSONB, default=[]) 
    engagement_level = Column(String(50), default="low") # high, medium, low
    learning_trend = Column(String(50), default="stable") # improving, declining, stable
    
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
