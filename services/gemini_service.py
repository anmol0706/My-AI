import google.generativeai as genai
from typing import List, Optional, Dict, Any
import asyncio
import logging
from datetime import datetime

from config.settings import settings
from models.chat_models import ChatMessage, ChatResponse, MessageRole
from exceptions.custom_exceptions import GeminiAPIException, TimeoutException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        """Initialize Gemini service with API key"""
        try:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("Gemini service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini service: {str(e)}")
            raise GeminiAPIException(f"Initialization failed: {str(e)}")
    
    def _format_conversation_history(self, history: List[ChatMessage]) -> List[Dict[str, str]]:
        """Format conversation history for Gemini API"""
        formatted_history = []
        for message in history:
            role = "user" if message.role == MessageRole.USER else "model"
            formatted_history.append({
                "role": role,
                "parts": [message.content]
            })
        return formatted_history
    
    async def generate_response(
        self,
        message: str,
        conversation_history: Optional[List[ChatMessage]] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> ChatResponse:
        """Generate AI response using Gemini API"""
        try:
            # Set generation parameters
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=max_tokens or settings.max_tokens,
                temperature=temperature or settings.temperature,
                top_p=0.8,
                top_k=40
            )
            
            # Start chat with history if provided
            if conversation_history:
                formatted_history = self._format_conversation_history(conversation_history)
                chat = self.model.start_chat(history=formatted_history)
            else:
                chat = self.model.start_chat()
            
            # Generate response with timeout
            start_time = datetime.now()
            
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        chat.send_message,
                        message,
                        generation_config=generation_config
                    ),
                    timeout=settings.request_timeout
                )
            except asyncio.TimeoutError:
                raise TimeoutException("Gemini API request timed out")
            
            generation_time = (datetime.now() - start_time).total_seconds()
            
            # Extract response text
            response_text = response.text if hasattr(response, 'text') else str(response)
            
            # Count tokens (approximate)
            tokens_used = len(response_text.split()) + len(message.split())
            
            logger.info(f"Generated response in {generation_time:.2f}s, ~{tokens_used} tokens")
            
            return ChatResponse(
                response=response_text,
                tokens_used=tokens_used,
                model_info={
                    "model": "gemini-1.5-flash",
                    "generation_time": generation_time,
                    "temperature": temperature or settings.temperature,
                    "max_tokens": max_tokens or settings.max_tokens
                }
            )
            
        except TimeoutException:
            raise
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise GeminiAPIException(f"Failed to generate response: {str(e)}")
    
    async def health_check(self) -> bool:
        """Check if Gemini service is healthy"""
        try:
            test_response = await self.generate_response("Hello", max_tokens=10)
            return bool(test_response.response)
        except Exception as e:
            logger.error(f"Gemini health check failed: {str(e)}")
            return False

# Create service instance
gemini_service = GeminiService()
