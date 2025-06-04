from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging

from models.image_models import (
    ImageGenerationRequest, 
    ImageGenerationResponse, 
    ImageGenerationError,
    ImageSize,
    ImageStyle
)
from services.huggingface_service import huggingface_service
from exceptions.custom_exceptions import HuggingFaceAPIException, ValidationException, TimeoutException

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/images", tags=["images"])

@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    """
    Generate images from text prompts using AI
    """
    try:
        # Validate request
        if not request.prompt.strip():
            raise ValidationException("Prompt cannot be empty")
        
        if len(request.prompt) > 1000:
            raise ValidationException("Prompt too long (max 1000 characters)")
        
        # Generate images using Hugging Face service
        response = await huggingface_service.generate_images(request)
        
        logger.info(f"Image generation completed successfully")
        return response
        
    except ValidationException as e:
        logger.warning(f"Validation error: {e.detail}")
        raise HTTPException(status_code=422, detail=e.detail)
    
    except TimeoutException as e:
        logger.error(f"Timeout error: {e.detail}")
        raise HTTPException(status_code=408, detail=e.detail)
    
    except HuggingFaceAPIException as e:
        logger.error(f"Hugging Face API error: {e.detail}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
    except Exception as e:
        logger.error(f"Unexpected error in image generation: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred while generating the image"
        )

@router.get("/health")
async def image_health_check():
    """
    Check the health of the image generation service
    """
    try:
        is_healthy = await huggingface_service.health_check()
        
        if is_healthy:
            return {"status": "healthy", "service": "huggingface"}
        else:
            raise HTTPException(
                status_code=503, 
                detail="Image generation service is currently unavailable"
            )
    
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=503, 
            detail="Image generation service health check failed"
        )

@router.get("/models")
async def get_available_models():
    """
    Get information about available image generation models
    """
    return huggingface_service.get_available_models()

@router.get("/sizes")
async def get_available_sizes():
    """
    Get available image sizes
    """
    return {
        "sizes": [
            {"id": size.value, "name": size.name.title(), "dimensions": size.value}
            for size in ImageSize
        ],
        "default_size": ImageSize.MEDIUM.value
    }

@router.get("/styles")
async def get_available_styles():
    """
    Get available image styles
    """
    return {
        "styles": [
            {"id": style.value, "name": style.name.title(), "description": f"{style.name.title()} style"}
            for style in ImageStyle
        ],
        "default_style": ImageStyle.REALISTIC.value
    }
