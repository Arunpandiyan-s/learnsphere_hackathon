from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth.jwt import verify_token
from app.db.session import get_db
from app.models.user import User

ADMIN_EMAIL = "arun.saravanan066@gmail.com"

def get_current_user(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    neon_user_id = payload.get("sub")
    email = payload.get("email", f"{neon_user_id}@placeholder.com")
    
    user = db.query(User).filter(User.neon_user_id == neon_user_id).first()
    
    # Auto User Creation if missing
    if not user:
        try:
            # Default is learner unless email perfectly matches the admin email map
            role = "admin" if email == ADMIN_EMAIL else "learner"
            user = User(neon_user_id=neon_user_id, email=email, role=role)
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception as e:
            db.rollback()
            user = db.query(User).filter(User.neon_user_id == neon_user_id).first()
            if not user:
                print("Failed to auto-create user due to concurrent insertion:", str(e))
                raise HTTPException(status_code=500, detail="Failed to initialize user session")
        
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    # Explicit admin override check (just in case)
    if current_user.email == ADMIN_EMAIL:
        return current_user
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin permissions required")
    return current_user

def require_instructor(current_user: User = Depends(get_current_user)):
    if current_user.email == ADMIN_EMAIL:
        return current_user
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Instructor permissions required")
    return current_user

def require_learner(current_user: User = Depends(get_current_user)):
    # All authenticated users are learners at minimum
    return current_user
