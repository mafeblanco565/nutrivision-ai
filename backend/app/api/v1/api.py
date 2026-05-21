from fastapi import APIRouter
from app.api.v1.endpoints import auth, profile, meals, macros, status

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(meals.router)
api_router.include_router(macros.router)
api_router.include_router(status.router)
