from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import ai

# Import Base and engine for table creation
from app.db.base import Base
from app.db.session import engine

import logging

logging.basicConfig(level=logging.DEBUG)

# Note: For production, it is typically better to use Alembic for DB migrations.

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

# Include Routers
app.include_router(ai.router, prefix=settings.API_V1_STR)
from app.routers import auth, courses, dashboard, profile, enrollments, tracking
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(profile.router, prefix=f"{settings.API_V1_STR}/profile", tags=["profile"])
app.include_router(courses.router, prefix=f"{settings.API_V1_STR}/courses", tags=["courses"])
app.include_router(enrollments.router, prefix=f"{settings.API_V1_STR}/enrollments", tags=["enrollments"])
app.include_router(tracking.router, prefix=f"{settings.API_V1_STR}", tags=["tracking"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "LearnSphere Backend is actively running"}
