from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    role: MessageRole
    content: str
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)
    metadata: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation context")
    max_tokens: Optional[int] = Field(default=1000, ge=1, le=4000, description="Maximum tokens in response")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0, description="Response creativity level")

class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    tokens_used: Optional[int] = None
    model_info: Optional[Dict[str, Any]] = None

class ConversationSummary(BaseModel):
    conversation_id: str
    message_count: int
    created_at: datetime
    last_updated: datetime
    preview: str  # First few words of the conversation

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    error_code: Optional[str] = None
