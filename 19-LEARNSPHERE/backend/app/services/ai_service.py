from sqlalchemy.orm import Session
from app.models.progress import LessonProgress
from app.models.course import Course, Enrollment
from app.models.user import User
from app.models.ai_conversation import AIConversation
from app.services.qubrid_service import ask_qubrid
from app.services.ai_context_service import build_ai_context

async def handle_ai_chat(db: Session, user: User, prompt: str) -> str:
    """
    Intelligently construct a prompt limiting token usage, incorporating user progress.
    """
    # 1. Obtain Context
    json_context = build_ai_context(user.id, db)

    # 2. Formulate Prompt
    system_context = f"""
    You are 'LearnSphere AI', an Academic Mentor.
    User Role: {user.role}
    
    Student learning context:
    {json_context}
    
    Rules:
    - Guide based on weak topics.
    - Mention progress percentage.
    - Suggest next lessons.
    - Give realistic learning schedule.
    Please instruct, motivate, and guide strictly corresponding to academic goals.
    """
    
    full_payload = f"{system_context}\n\nUser Question: {prompt}"
    
    # 4. Request interaction
    ai_response = await ask_qubrid(full_payload)
    
    # 5. Store conversation
    conversation = AIConversation(user_id=user.id, message=prompt, response=ai_response)
    db.add(conversation)
    db.commit()
    
    return ai_response
