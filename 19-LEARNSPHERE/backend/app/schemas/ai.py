from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000, description="The user's query")

class ChatResponse(BaseModel):
    response: str
