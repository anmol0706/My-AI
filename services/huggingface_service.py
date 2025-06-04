import httpx
import asyncio
import base64
import io
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from PIL import Image

from config.settings import settings
from models.image_models import (
    ImageGenerationRequest, 
    ImageGenerationResponse, 
    GeneratedImage,
    ImageSize
)
from exceptions.custom_exceptions import HuggingFaceAPIException, TimeoutException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HuggingFaceService:
    def __init__(self):
        """Initialize Hugging Face service"""
        self.api_key = settings.huggingface_api_key
        self.base_url = "https://api-inference.huggingface.co/models"

        # Available models with their capabilities - Only working models
        self.models = {
            "sdxl": {
                "name": "stabilityai/stable-diffusion-xl-base-1.0",
                "display_name": "Stable Diffusion XL",
                "description": "High-quality, versatile image generation",
                "max_resolution": "1024x1024",
                "strengths": ["photorealistic", "detailed", "versatile"]
            }
        }

        self.default_model = "sdxl"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        logger.info("Hugging Face service initialized successfully")
    
    def _parse_size(self, size: ImageSize) -> tuple:
        """Parse image size string to width, height tuple"""
        width, height = size.value.split('x')
        return int(width), int(height)
    
    def _image_to_base64(self, image_bytes: bytes) -> str:
        """Convert image bytes to base64 string"""
        return base64.b64encode(image_bytes).decode('utf-8')
    
    def _resize_image_if_needed(self, image_bytes: bytes, target_size: ImageSize) -> bytes:
        """Resize image if it doesn't match target size"""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            target_width, target_height = self._parse_size(target_size)
            
            if image.size != (target_width, target_height):
                image = image.resize((target_width, target_height), Image.Resampling.LANCZOS)
                
                # Convert back to bytes
                output = io.BytesIO()
                image.save(output, format='PNG')
                return output.getvalue()
            
            return image_bytes
        except Exception as e:
            logger.warning(f"Failed to resize image: {str(e)}")
            return image_bytes
    
    def _get_model_info(self, model_key: str = None):
        """Get model information"""
        model_key = model_key or self.default_model
        return self.models.get(model_key, self.models[self.default_model])

    def _enhance_prompt(self, prompt: str, style: str) -> str:
        """Enhance prompt based on style"""
        style_enhancements = {
            "realistic": "photorealistic, high quality, detailed, professional photography",
            "artistic": "artistic, creative, beautiful composition, masterpiece",
            "cartoon": "cartoon style, animated, colorful, stylized",
            "abstract": "abstract art, creative, unique, artistic interpretation"
        }

        enhancement = style_enhancements.get(style, "")
        if enhancement:
            return f"{prompt}, {enhancement}"
        return prompt

    def _get_negative_prompt_defaults(self, style: str) -> str:
        """Get default negative prompts based on style"""
        base_negative = "blurry, low quality, distorted, deformed, ugly, bad anatomy"

        style_negatives = {
            "realistic": f"{base_negative}, cartoon, anime, painting, drawing, sketch",
            "artistic": f"{base_negative}, photograph, realistic",
            "cartoon": f"{base_negative}, realistic, photograph, dark, gritty",
            "abstract": f"{base_negative}, realistic, literal, obvious"
        }

        return style_negatives.get(style, base_negative)

    async def generate_images(self, request: ImageGenerationRequest) -> ImageGenerationResponse:
        """Generate images using Hugging Face API with enhanced features"""
        try:
            start_time = datetime.now()

            # Get model info
            model_info = self._get_model_info(getattr(request, 'model', None))
            model_name = model_info["name"]

            # Enhance prompt based on style
            enhanced_prompt = self._enhance_prompt(request.prompt, request.style.value)

            # Combine user negative prompt with defaults
            default_negative = self._get_negative_prompt_defaults(request.style.value)
            combined_negative = f"{request.negative_prompt}, {default_negative}" if request.negative_prompt else default_negative

            # Prepare the payload
            width, height = self._parse_size(request.size)

            # Adjust parameters based on model
            steps = request.steps
            guidance_scale = request.guidance_scale

            # SDXL Turbo uses different parameters
            if "turbo" in model_name.lower():
                steps = min(steps, 4)  # Turbo models work best with 1-4 steps
                guidance_scale = min(guidance_scale, 2.0)  # Lower guidance for turbo

            payload = {
                "inputs": enhanced_prompt,
                "parameters": {
                    "negative_prompt": combined_negative,
                    "width": width,
                    "height": height,
                    "guidance_scale": guidance_scale,
                    "num_inference_steps": steps,
                    "num_images_per_prompt": request.num_images
                }
            }

            if request.seed is not None:
                payload["parameters"]["seed"] = request.seed

            # Make API request
            logger.info(f"Generating image with model: {model_name}")
            logger.info(f"Request payload: {payload}")

            async with httpx.AsyncClient(timeout=120.0) as client:
                try:
                    response = await client.post(
                        f"{self.base_url}/{model_name}",
                        headers=self.headers,
                        json=payload
                    )
                    logger.info(f"API response status: {response.status_code}")
                except httpx.TimeoutException:
                    raise TimeoutException("Hugging Face API request timed out")

                if response.status_code == 503:
                    # Model is loading, wait and retry
                    logger.info(f"Model {model_name} is loading, waiting...")
                    await asyncio.sleep(15)
                    response = await client.post(
                        f"{self.base_url}/{model_name}",
                        headers=self.headers,
                        json=payload
                    )
                    logger.info(f"Retry API response status: {response.status_code}")

                if response.status_code != 200:
                    error_detail = response.text
                    logger.error(f"Hugging Face API error {response.status_code}: {error_detail}")
                    logger.error(f"Request URL: {self.base_url}/{model_name}")
                    logger.error(f"Request headers: {self.headers}")
                    raise HuggingFaceAPIException(
                        f"API returned status {response.status_code}: {error_detail}",
                        status_code=response.status_code
                    )
                
                # Process response
                image_bytes = response.content
                
                # Resize if needed
                resized_image_bytes = self._resize_image_if_needed(image_bytes, request.size)
                
                # Convert to base64
                image_base64 = self._image_to_base64(resized_image_bytes)
                
                generation_time = (datetime.now() - start_time).total_seconds()
                
                # Create response
                generated_image = GeneratedImage(
                    image_url=f"data:image/png;base64,{image_base64}",
                    image_data=image_base64,
                    prompt=enhanced_prompt,
                    negative_prompt=combined_negative,
                    generation_params={
                        "original_prompt": request.prompt,
                        "enhanced_prompt": enhanced_prompt,
                        "size": request.size.value,
                        "style": request.style.value,
                        "guidance_scale": guidance_scale,
                        "steps": steps,
                        "seed": request.seed,
                        "model": model_info["display_name"]
                    },
                    image_id=f"img_{int(datetime.now().timestamp())}"
                )

                logger.info(f"Generated image using {model_info['display_name']} in {generation_time:.2f}s")

                return ImageGenerationResponse(
                    images=[generated_image],
                    generation_time=generation_time,
                    model_info={
                        "model": model_info["display_name"],
                        "model_key": model_info.get("name", ""),
                        "description": model_info.get("description", ""),
                        "generation_time": generation_time,
                        "enhanced_prompt": enhanced_prompt
                    },
                    request_id=f"req_{int(datetime.now().timestamp())}"
                )
                
        except TimeoutException:
            raise
        except HuggingFaceAPIException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in image generation: {str(e)}")
            raise HuggingFaceAPIException(f"Image generation failed: {str(e)}")
    
    def get_available_models(self) -> dict:
        """Get list of available models"""
        return {
            "models": [
                {
                    "id": key,
                    "name": model["display_name"],
                    "description": model["description"],
                    "max_resolution": model["max_resolution"],
                    "strengths": model["strengths"]
                }
                for key, model in self.models.items()
            ],
            "default_model": self.default_model
        }

    async def health_check(self) -> bool:
        """Check if Hugging Face service is healthy"""
        try:
            test_request = ImageGenerationRequest(
                prompt="test",
                size=ImageSize.SMALL,
                num_images=1,
                steps=10
            )
            response = await self.generate_images(test_request)
            return len(response.images) > 0
        except Exception as e:
            logger.error(f"Hugging Face health check failed: {str(e)}")
            return False

# Create service instance
huggingface_service = HuggingFaceService()
