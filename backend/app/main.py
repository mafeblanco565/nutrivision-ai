from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from loguru import logger
import sys

from app.core.config import settings
from app.api.v1.api import api_router
from app.middleware.rate_limit import limiter

# Configure structured logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="DEBUG" if settings.DEBUG else "INFO",
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered nutrition tracking platform",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.get("/health", tags=["health"])
async def health_check():
    import os
    gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "vision": "gemini" if gemini_key else "mock",
    }


# Mount versioned API
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.APP_ENV}]")
    import subprocess
    try:
        logger.info("Running database migrations...")
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode != 0:
            logger.error(f"Migration failed (exit {result.returncode}): {result.stderr}")
        else:
            logger.info(f"Migrations OK: {result.stdout.strip() or 'no new migrations'}")
    except Exception as e:
        logger.error(f"Migration error: {e}")

    from app.core.security import refresh_supabase_jwks
    if await refresh_supabase_jwks():
        logger.info("Supabase JWKS loaded successfully")
    else:
        logger.warning("Could not load Supabase JWKS — check SUPABASE_URL env var")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down application")
