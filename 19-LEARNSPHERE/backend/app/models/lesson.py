import uuid
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.enums import LessonType

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    type = Column(Enum(LessonType, name="lesson_type", create_type=True), default=LessonType.video, nullable=False)
    duration_minutes = Column(Integer, default=0)
    order_index = Column(Integer, nullable=False, default=0)
    
    course = relationship("Course", back_populates="lessons")
