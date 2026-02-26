import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.enums import UserRole

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    neon_user_id = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(Enum(UserRole, name="user_role", create_type=True), default=UserRole.learner, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    enrollments = relationship("Enrollment", back_populates="learner", cascade="all, delete-orphan")
