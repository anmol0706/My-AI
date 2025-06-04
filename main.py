from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging
import time
from contextlib import asynccontextmanager

from config.settings import settings
from routers import chat_router, image_router
from exceptions.custom_exceptions import AIServiceException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI Web Application...")
    logger.info(f"Debug mode: {settings.debug}")
    yield
    # Shutdown
    logger.info("Shutting down AI Web Application...")

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="AI Web Application with Chatbot and Image Generation",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Add trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.localhost"]
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
    
    return response

# Include routers
app.include_router(chat_router.router)
app.include_router(image_router.router)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Root endpoint - serve the main application
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Serve the main application page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/image-generator", response_class=HTMLResponse)
async def image_generator(request: Request):
    """Serve the dedicated image generator page"""
    return templates.TemplateResponse("image_generator.html", {"request": request})

# Health check endpoint
@app.get("/health")
async def health_check():
    """Application health check"""
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": "1.0.0",
        "debug": settings.debug
    }

# Global exception handler
@app.exception_handler(AIServiceException)
async def ai_service_exception_handler(request: Request, exc: AIServiceException):
    logger.error(f"AI Service Exception: {exc.detail}")
    return HTTPException(status_code=exc.status_code, detail=exc.detail)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    return HTTPException(
        status_code=500,
        detail="An unexpected error occurred. Please try again later."
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
