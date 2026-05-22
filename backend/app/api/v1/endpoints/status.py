import os
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/status", tags=["status"])


@router.get("")
def get_status():
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip() or (settings.OPENROUTER_API_KEY or "")
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip() or (settings.GEMINI_API_KEY or "")

    if openrouter_key:
        provider = "openrouter"
    elif gemini_key:
        provider = "gemini"
    else:
        provider = "mock"

    return {
        "vision_provider": provider,
        "openrouter_configured": bool(openrouter_key),
        "gemini_configured": bool(gemini_key),
        "code_version": "openrouter-nemotron",
    }
