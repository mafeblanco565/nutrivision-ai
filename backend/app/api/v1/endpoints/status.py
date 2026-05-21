from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/status", tags=["status"])


@router.get("")
def get_status():
    gemini_configured = bool(settings.GEMINI_API_KEY)
    return {
        "vision_provider": "gemini" if gemini_configured else "mock",
        "gemini_configured": gemini_configured,
    }
