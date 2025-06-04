from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging

from models.chat_models import ChatRequest, ChatResponse, ErrorResponse
from services.gemini_service import gemini_service
from exceptions.custom_exceptions import GeminiAPIException, ValidationException, TimeoutException

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a message to the AI chatbot and get a response
    """
    try:
        # Validate request
        if not request.message.strip():
            raise ValidationException("Message cannot be empty")
        
        if len(request.message) > 2000:
            raise ValidationException("Message too long (max 2000 characters)")
        
        # Generate response using Gemini service
        response = await gemini_service.generate_response(
            message=request.message,
            conversation_history=request.conversation_history,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        logger.info(f"Chat response generated successfully")
        return response
        
    except ValidationException as e:
        logger.warning(f"Validation error: {e.detail}")
        raise HTTPException(status_code=422, detail=e.detail)
    
    except TimeoutException as e:
        logger.error(f"Timeout error: {e.detail}")
        raise HTTPException(status_code=408, detail=e.detail)
    
    except GeminiAPIException as e:
        logger.error(f"Gemini API error: {e.detail}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred while processing your message"
        )

@router.get("/health")
async def chat_health_check():
    """
    Check the health of the chat service
    """
    try:
        is_healthy = await gemini_service.health_check()
        
        if is_healthy:
            return {"status": "healthy", "service": "gemini"}
        else:
            raise HTTPException(
                status_code=503, 
                detail="Chat service is currently unavailable"
            )
    
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=503, 
            detail="Chat service health check failed"
        )

@router.get("/models")
async def get_available_models():
    """
    Get information about available chat models
    """
    return {
        "models": [
            {
                "id": "gemini-1.5-flash",
                "name": "Google Gemini 1.5 Flash",
                "description": "Fast and efficient conversational AI model",
                "max_tokens": 4000,
                "supports_conversation": True
            }
        ],
        "default_model": "gemini-1.5-flash"
    }
