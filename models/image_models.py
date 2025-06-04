from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class ImageSize(str, Enum):
    SMALL = "512x512"
    MEDIUM = "768x768"
    LARGE = "1024x1024"

class ImageStyle(str, Enum):
    REALISTIC = "realistic"
    ARTISTIC = "artistic"
    CARTOON = "cartoon"
    ABSTRACT = "abstract"

class ImageModel(str, Enum):
    SDXL = "sdxl"
    SD_TURBO = "sd_turbo"
    PLAYGROUND = "playground"
    REALISTIC = "realistic"

class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000, description="Text prompt for image generation")
    negative_prompt: Optional[str] = Field(default="", max_length=500, description="What to avoid in the image")
    size: Optional[ImageSize] = Field(default=ImageSize.MEDIUM, description="Image dimensions")
    style: Optional[ImageStyle] = Field(default=ImageStyle.REALISTIC, description="Image style")
    model: Optional[ImageModel] = Field(default=ImageModel.SDXL, description="AI model to use for generation")
    num_images: Optional[int] = Field(default=1, ge=1, le=4, description="Number of images to generate")
    guidance_scale: Optional[float] = Field(default=7.5, ge=1.0, le=20.0, description="How closely to follow the prompt")
    steps: Optional[int] = Field(default=20, ge=10, le=50, description="Number of denoising steps")
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")

class GeneratedImage(BaseModel):
    image_url: str
    image_data: Optional[str] = None  # Base64 encoded image data
    prompt: str
    negative_prompt: Optional[str] = None
    generation_params: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)
    image_id: Optional[str] = None

class ImageGenerationResponse(BaseModel):
    images: List[GeneratedImage]
    generation_time: Optional[float] = None
    model_info: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None

class ImageHistory(BaseModel):
    image_id: str
    prompt: str
    thumbnail_url: Optional[str] = None
    created_at: datetime
    size: ImageSize
    style: ImageStyle

class ImageGenerationError(BaseModel):
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
