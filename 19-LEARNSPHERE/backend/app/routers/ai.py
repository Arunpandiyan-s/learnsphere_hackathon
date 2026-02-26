from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.ai import ChatRequest, ChatResponse
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.db.session import get_db
from app.services.ai_service import handle_ai_chat

router = APIRouter(prefix="/ai", tags=["AI Personalized Chat"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    response_text = await handle_ai_chat(db, current_user, request.prompt)
    return ChatResponse(response=response_text)
