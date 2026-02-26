# LearnSphere Backend Architecture (FastAPI + Neon + Qubrid AI)

## 1️⃣ Architecture Diagram

```mermaid
graph TD
    %% Frontend
    Client[React Frontend]
    
    %% Auth
    NeonAuth[Neon Auth Provider]
    
    %% Backend
    API[FastAPI Backend]
    
    %% External Services
    Qubrid[Qubrid AI API]
    
    %% Database
    NeonDB[(Neon PostgreSQL)]

    %% Flow: Auth
    Client -- "1. Login / Register" --> NeonAuth
    NeonAuth -- "2. Returns JWT Token" --> Client
    
    %% Flow: API Requests
    Client -- "3. API Request + Bearer JWT" --> API
    API -- "4. Verify JWT (JWKS)" --> NeonAuth
    
    %% Flow: Database
    API -- "5. Fetch/Update Data (Roles, Progress)" --> NeonDB
    
    %% Flow: AI
    API -- "6. Personalized Prompt context" --> Qubrid
    Qubrid -- "7. Chat Completion" --> API
    API -- "8. Return AI Response" --> Client
```

## 2️⃣ Neon Auth Flow Explanation

1. **Client-Side Authentication:** The React frontend integrates the Neon Auth SDK. The user logs in securely directly against the managed Neon Auth service, removing the need for Firebase.
2. **Token Issuance:** Upon successful login, Neon Auth issues a secure JWT (JSON Web Token) containing identity claims to the frontend.
3. **API Authorization:** For every secure request to the FastAPI backend, the React frontend attaches this JWT in the `Authorization: Bearer <token>` header.
4. **Backend Verification:** The FastAPI backend does **not** manage passwords or sessions manually. Instead, it uses a middleware/dependency to intercept the token, fetches the Neon Auth JWKS (JSON Web Key Set), and cryptographically verifies the token's signature and expiration.
5. **Database Resolution:** After the token is verified, FastAPI extracts the `neon_user_id` from the JWT payload and queries the PostgreSQL database to retrieve application-specific data, guaranteeing role-based access.

## 3️⃣ FastAPI Token Verification Code

```python
# app/auth/jwt.py
import urllib.request
import json
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()

def get_jwks():
    # Cache this in production
    url = f"{settings.NEON_AUTH_URL}/.well-known/jwks.json"
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode())

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        jwks = get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if rsa_key:
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=settings.NEON_AUTH_AUDIENCE,
                issuer=settings.NEON_AUTH_ISSUER
            )
            return payload
        raise HTTPException(status_code=401, detail="Invalid token header")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
```

## 4️⃣ Role-Based Middleware (Dependencies)

```python
# app/auth/dependencies.py
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth.jwt import verify_token
from app.database import get_db
from app.models.user import User

def get_current_user(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    # Extract identity claim from token
    neon_user_id = payload.get("sub")
    user = db.query(User).filter(User.neon_user_id == neon_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in database")
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
    # All authenticated users are learners at minimum
    return current_user
```

## 5️⃣ SQL Schema (PostgreSQL)

```sql
-- app/models/schema.sql

CREATE TYPE user_role AS ENUM ('admin', 'mentor', 'learner');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neon_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'learner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lesson_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    completion_percent INTEGER DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, course_id)
);

CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 6️⃣ Frontend Auth Changes

Remove Firebase usage (`firebase/auth`) entirely. Transition to the SDK generated explicitly for Neon projects.

```typescript
// src/api/axios.ts (New API Interceptor Layer)
import axios from 'axios';
// Hypothetical method provided by the Neon Auth / Better Auth SDK
import { getSessionToken } from '@/lib/neonAuth'; 

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Automatically inject JWT token into all requests
api.interceptors.request.use(async (config) => {
    const token = await getSessionToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
```

## 7️⃣ AI Personalization Flow

```python
# app/routers/ai.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.services.qubrid_service import ask_qubrid
from app.database import get_db

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.post("/chat")
async def chat_with_ai(
    prompt: str, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # 1. User identified dynamically from Neon Token via dependency
    
    # 2. Fetch specific learner progress metrics & profile limits from Postgres
    progress = db.query(LessonProgress).filter(LessonProgress.user_id == current_user.id).all()
    
    # 3. Build highly personalized context logic
    progress_summary = ", ".join([f"Course {p.course_id}: {p.completion_percent}%" for p in progress])
    
    system_context = f"""
    You are 'LearnSphere AI', an Academic Learning Assistant.
    The user you are speaking to has the role: {current_user.role}.
    Their display name is {current_user.profile.display_name}.
    Current Learning Progress: {progress_summary if progress_summary else 'No courses started yet.'}
    
    Focus on helping them complete their courses, motivating them, and adhering strictly to learning-related objectives.
    """
    
    # 4. Inject strict context instructions before formatting Qubrid API constraints
    full_prompt = f"{system_context}\n\nUser Question: {prompt}"
    
    # Keeps existing retry logic wrapped safely in service layer
    response = await ask_qubrid(full_prompt)
    
    return {"message": response}
```

## 8️⃣ Environment Variables Setup

Update production infrastructure keys. Firebase values should be completely stripped out.

**Backend (`.env`)**
```env
# Fastapi Application
DATABASE_URL=postgresql://user:password@ep-withered-base-XXXXXX.us-east-2.aws.neon.tech/neondb
NEON_AUTH_URL=https://your-neon-auth-domain.com
NEON_AUTH_AUDIENCE=your-audience
NEON_AUTH_ISSUER=your-issuer

# Extracted from older frontend
QUBRID_API_KEY=your_qubrid_api_key_here
QUBRID_BASE_URL=https://platform.qubrid.com/api/v1/qubridai
```

**Frontend (`.env.example`)**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_NEON_AUTH_URL=https://your-neon-auth-domain.com
```

---

### Folder Structure Overview

```text
app/
├── main.py
├── database.py
├── auth/
│   ├── jwt.py
│   └── dependencies.py
├── models/
│   ├── base.py
│   └── user.py
├── schemas/
│   └── user_schema.py
├── routers/
│   └── ai.py
├── services/
│   └── qubrid_service.py
└── middleware/
    └── cors.py
```
