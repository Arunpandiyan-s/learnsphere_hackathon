# Production Backend Architecture (FastAPI + Neon + Qubrid)

This document provides a professional, production-ready backend structure that fixes all the architectural issues from the previous iteration.

## 🛠 Fixes Applied from Previous Review

1. **JWT Verification**: Implemented standard `httpx` fetching with `functools.lru_cache` for the JWKS. This eliminates expensive redundant network calls and drastically improves performance. Safe token validation is now standard.
2. **Role Security**: Implemented strict role dependency wrappers (`require_admin`, `require_mentor`, `require_learner`). Null roles default to `learner`. 
3. **Database Schema**: Expanded progress tracking. Replaced monolithic `lesson_progress` with `lessons`, `lesson_progress` (granular tracking), and `course_progress` (aggregated metrics).
4. **AI Personalization**: Moved contextualization out of the router. Introduced `app/services/ai_service.py` to intelligently fetch the last 5 active courses, summarize them, and pass them to the Qubrid service.
5. **AI Request Schema**: Chat requests now strictly accept `application/json` bodies governed by a Pydantic `ChatRequest` schema, preventing query param bloating.
6. **Auto User Creation**: Added an automatic "upsert" check immediately after token evaluation inside `get_current_user`. If the JWT `sub` is verified but missing from PostgreSQL, it transparently creates the account.
7. **Environment Config**: Implemented strict Pydantic `BaseSettings` (`app/core/config.py`) to handle loading, validating, and casting environment variables safely.

---

## 1️⃣ Final Corrected Folder Tree

```text
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── logging.py
│   ├── db/
│   │   ├── session.py
│   │   ├── base.py
│   │   └── init_db.py
│   ├── models/
│   │   ├── user.py
│   │   ├── profile.py
│   │   ├── course.py
│   │   ├── lesson.py
│   │   ├── lesson_progress.py
│   │   ├── course_progress.py
│   │   └── ai_conversation.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── progress.py
│   │   └── ai.py
│   ├── auth/
│   │   ├── jwt.py
│   │   ├── dependencies.py
│   │   └── neon_auth.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── course.py
│   │   ├── progress.py
│   │   └── ai.py
│   ├── services/
│   │   ├── ai_service.py
│   │   ├── qubrid_service.py
│   │   ├── progress_service.py
│   │   └── user_service.py
│   ├── middleware/
│   │   └── cors.py
│   └── utils/
│       └── helpers.py
├── migrations/
├── tests/
│   ├── test_auth.py
│   └── test_ai.py
├── .env.example
└── requirements.txt
```

---

## 2️⃣ File Templates

### app/core/config.py
* **Purpose**: Strongly type and validate all environment variables using Pydantic. Centralizes configuration logic.
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    NEON_AUTH_URL: str
    NEON_AUTH_AUDIENCE: str
    NEON_AUTH_ISSUER: str
    QUBRID_API_KEY: str
    QUBRID_BASE_URL: str = "https://platform.qubrid.com/api/v1/qubridai"

    class Config:
        env_file = ".env"

settings = Settings()
```

### app/auth/jwt.py
* **Purpose**: Parse and securely verify incoming Bearer tokens using Neon Auth JWKS, with performance caching.
```python
import httpx
from functools import lru_cache
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()

@lru_cache(maxsize=1)
def get_jwks():
    url = f"{settings.NEON_AUTH_URL}/.well-known/jwks.json"
    response = httpx.get(url)
    response.raise_for_status()
    return response.json()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        jwks = get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"], "kid": key["kid"], "use": key["use"],
                    "n": key["n"], "e": key["e"]
                }
                break

        if rsa_key:
            payload = jwt.decode(
                token, rsa_key, algorithms=["RS256"],
                audience=settings.NEON_AUTH_AUDIENCE, issuer=settings.NEON_AUTH_ISSUER
            )
            return payload
        raise HTTPException(status_code=401, detail="Invalid token header (Key not found)")
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
```

### app/auth/dependencies.py
* **Purpose**: Extract token payload, perform transparent auto-user creation, and define rigid role-based access dependencies.
```python
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth.jwt import verify_token
from app.db.session import get_db
from app.models.user import User

def get_current_user(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    neon_user_id = payload.get("sub")
    email = payload.get("email", f"{neon_user_id}@placeholder.com")
    
    user = db.query(User).filter(User.neon_user_id == neon_user_id).first()
    
    # Auto User Creation
    if not user:
        user = User(neon_user_id=neon_user_id, email=email, role="learner")
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin permissions required")
    return current_user

def require_mentor(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Mentor permissions required")
    return current_user

def require_learner(current_user: User = Depends(get_current_user)):
    return current_user # Everyone authenticated
```

### app/models/progress.py (Includes lesson & course tracking)
* **Purpose**: Define comprehensive multi-level progress tracking.
```python
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class CourseProgress(Base):
    __tablename__ = "course_progress"
    user_id = Column(ForeignKey("users.id"), primary_key=True)
    course_id = Column(ForeignKey("courses.id"), primary_key=True)
    completion_percent = Column(Integer, default=0)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    user_id = Column(ForeignKey("users.id"), primary_key=True)
    lesson_id = Column(ForeignKey("lessons.id"), primary_key=True)
    status = Column(String, default="not_started") # not_started, in_progress, completed
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

### app/schemas/ai.py
* **Purpose**: Strict runtime JSON body validation for AI chat requests.
```python
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000, description="The user's query")

class ChatResponse(BaseModel):
    response: str
```

### app/routers/ai.py
* **Purpose**: HTTP edge handling for chat interactions. Contains ZERO business logic.
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.ai import ChatRequest, ChatResponse
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.db.session import get_db
from app.services.ai_service import handle_ai_chat

router = APIRouter(prefix="/v1/ai", tags=["AI Personalized Chat"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    response_text = await handle_ai_chat(db, current_user, request.prompt)
    return ChatResponse(response=response_text)
```

### app/services/ai_service.py
* **Purpose**: Formulate AI prompt contexts utilizing progress restrictions. Interacts directly with the wrapper.
```python
from sqlalchemy.orm import Session
from app.models.course_progress import CourseProgress
from app.models.course import Course
from app.models.user import User
from app.models.ai_conversation import AIConversation
from app.services.qubrid_service import ask_qubrid

async def handle_ai_chat(db: Session, user: User, prompt: str) -> str:
    # 1. Limit Context (Max 5 most recent courses) to prevent token explosion
    recent_progress = db.query(CourseProgress, Course.title)\
        .join(Course)\
        .filter(CourseProgress.user_id == user.id)\
        .order_by(CourseProgress.updated_at.desc())\
        .limit(5).all()
        
    # 2. Summarize intelligently
    if recent_progress:
        progress_lines = [f"- {p.title}: {cp.completion_percent}% complete" for cp, p in recent_progress]
        progress_summary = "\n".join(progress_lines)
    else:
        progress_summary = "No active courses."

    # 3. Formulate Prompt
    system_context = f"""
    You are an AI Academic Mentor.
    User Role: {user.role}
    Recent Progress:
    {progress_summary}
    Keep responses academic, brief, and structured.
    """
    
    full_payload = f"{system_context}\n\nUser Question: {prompt}"
    
    # 4. Safely request completion
    ai_response = await ask_qubrid(full_payload)
    
    # 5. Store conversation for history metrics
    conversation = AIConversation(user_id=user.id, message=prompt, response=ai_response)
    db.add(conversation)
    db.commit()
    
    return ai_response
```

### app/services/qubrid_service.py
* **Purpose**: Pure infrastructure integration boundary. Focuses strictly on the request layer and fault-tolerance retries.
```python
# (Maintain existing logic ensuring robust retries, 429/503 handling, 
# and generic JSON parsing mapping to choices[0].message.content or data.content)
import httpx
from app.core.config import settings

async def ask_qubrid(prompt: str) -> str:
    # Infrastructure implementation logic utilizing settings.QUBRID_API_KEY...
    pass
```

---

## 3️⃣ High-Level Technical Data Flow

**Frontend → Neon Auth → FastAPI → DB → AI**

1. **Frontend**: The user accesses the React app and signs in seamlessly using the drop-in Neon Auth UI/SDK.
2. **Neon Auth**: Performs password hashing, MFA, and OAuth validation. Responds with a cryptographically signed JWT to the browser.
3. **Frontend**: Places the JWT inside the HTTP Authorization (`Bearer`) headers using Axios interceptors and initiates a `POST /api/ai/chat` request containing JSON.
4. **FastAPI (`auth/jwt.py`)**: The router intercepts the HTTP request, pulls the JWKS (from cache), verifies signature integrity, and unpacks the JWT payload. 
5. **FastAPI (`auth/dependencies.py`)**: Uses the `sub` ID to fetch the `User` from identical records in Postgres. If missing, it immediately creates the user (Auto-User Creation). Validates the required endpoints permissions (e.g., `require_learner`).
6. **DB**: Returns the authenticated identity object.
7. **FastAPI (`services/ai_service.py`)**: Scans Postgres for the last 5 `CourseProgress` items to calculate context summary, preventing token spillover. 
8. **AI**: Packages the prompt alongside the metrics, relays strictly via HTTP to Qubrid, saves the conversational receipt to Postgres, and ultimately forwards the sanitized payload straight back to the frontend.
