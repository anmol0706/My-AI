from fastapi import HTTPException
from typing import Optional, Any, Dict

class AIServiceException(HTTPException):
    """Base exception for AI service errors"""
    def __init__(
        self,
        status_code: int = 500,
        detail: str = "AI service error",
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)

class GeminiAPIException(AIServiceException):
    """Exception for Gemini API errors"""
    def __init__(
        self,
        detail: str = "Gemini API error",
        status_code: int = 500
    ):
        super().__init__(status_code=status_code, detail=f"Gemini API: {detail}")

class HuggingFaceAPIException(AIServiceException):
    """Exception for Hugging Face API errors"""
    def __init__(
        self,
        detail: str = "Hugging Face API error",
        status_code: int = 500
    ):
        super().__init__(status_code=status_code, detail=f"Hugging Face API: {detail}")

class ValidationException(HTTPException):
    """Exception for validation errors"""
    def __init__(
        self,
        detail: str = "Validation error",
        status_code: int = 422
    ):
        super().__init__(status_code=status_code, detail=detail)

class RateLimitException(HTTPException):
    """Exception for rate limiting"""
    def __init__(
        self,
        detail: str = "Rate limit exceeded",
        status_code: int = 429
    ):
        super().__init__(status_code=status_code, detail=detail)

class TimeoutException(HTTPException):
    """Exception for request timeouts"""
    def __init__(
        self,
        detail: str = "Request timeout",
        status_code: int = 408
    ):
        super().__init__(status_code=status_code, detail=detail)
