from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.profile import UserProfile
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class ProfileUpdateParams(BaseModel):
    email: str
    displayName: str | None = None
    username: str | None = None
    phone: str | None = None
    bio: str | None = None
    location: str | None = None
    interests: str | None = None

@router.get("")
def read_profile(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        return None
        
    return {
        "displayName": profile.display_name,
        "username": user.name,
        "email": email,
        "phone": None,
        "bio": profile.bio,
        "location": None,
        "interests": None,
        "updatedAt": None
    }

@router.post("")
def update_profile(params: ProfileUpdateParams, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == params.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    
    if profile:
        profile.display_name = params.displayName or profile.display_name
        profile.bio = params.bio or profile.bio
    else:
        profile = UserProfile(
            user_id=user.id,
            display_name=params.displayName,
            bio=params.bio,
        )
        db.add(profile)
        
    db.commit()
    db.refresh(profile)
    return {"message": "Profile updated successfully"}
