from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.auth.dependencies import get_current_user, ADMIN_EMAIL
from app.db.session import get_db
from app.models.user import User

router = APIRouter()

class RegisterProfileRequest(BaseModel):
    role: str

@router.post("/register-profile")
def register_profile(
    request: RegisterProfileRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Admin email override to prevent tampering
    if current_user.email == ADMIN_EMAIL:
        current_user.role = "admin"
    elif request.role in ["learner", "instructor"]:
        current_user.role = request.role
    else:
        # Fallback security, cannot self-assign admin
        current_user.role = "learner"
        
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile configured", "role": current_user.role}
