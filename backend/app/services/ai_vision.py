"""
AI Vision Service — multi-provider con fallback automático.

Proveedor activo según keys disponibles (en orden de prioridad):
  1. OpenRouterVisionProvider  (Llama 3.2 Vision — gratis, openrouter.ai)
  2. GeminiVisionProvider      (gemini-1.5-flash — gratis con cuota diaria)
  3. MockVisionProvider        (datos simulados, sin API key)
"""
import httpx
import base64
import json
import os
import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
from loguru import logger
from app.core.config import settings


@dataclass
class DetectedFood:
    name: str
    quantity_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float = 0.0
    confidence: float = 0.0


@dataclass
class VisionAnalysisResult:
    foods: list[DetectedFood] = field(default_factory=list)
    total_calories: float = 0.0
    total_protein_g: float = 0.0
    total_carbs_g: float = 0.0
    total_fat_g: float = 0.0
    total_fiber_g: float = 0.0
    confidence: float = 0.0
    raw_response: Optional[str] = None
    error: Optional[str] = None

    def calculate_totals(self) -> None:
        self.total_calories = sum(f.calories for f in self.foods)
        self.total_protein_g = sum(f.protein_g for f in self.foods)
        self.total_carbs_g = sum(f.carbs_g for f in self.foods)
        self.total_fat_g = sum(f.fat_g for f in self.foods)
        self.total_fiber_g = sum(f.fiber_g for f in self.foods)
        if self.foods:
            self.confidence = sum(f.confidence for f in self.foods) / len(self.foods)


class VisionProvider(ABC):
    @abstractmethod
    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> VisionAnalysisResult:
        pass


VISION_PROMPT = """You are a nutrition expert analyzing a food photo. Look carefully at the actual image and identify exactly what you see.

IMPORTANT: Describe only what is ACTUALLY visible in the image. Do not guess or assume.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "foods": [
    {
      "name": "nombre en español del alimento real visible",
      "quantity_g": 150,
      "calories": 247,
      "protein_g": 31.0,
      "carbs_g": 0.0,
      "fat_g": 5.5,
      "fiber_g": 0.0,
      "confidence": 0.92
    }
  ]
}

Rules:
- Identify every distinct food item visible in the photo
- Estimate grams based on portion size relative to the plate/container
- Calculate calories and macros from standard nutritional data for those grams
- confidence: 0.0-1.0 (how certain you are about this specific item)
- Name foods in Spanish
- If unsure about a specific food, describe it (e.g., "salsa roja", "vegetal verde")
- A sandwich is "sandwich" or "sándwich", pizza is "pizza", burger is "hamburguesa"
"""


def _build_result_from_parsed(parsed: dict, raw: str) -> VisionAnalysisResult:
    result = VisionAnalysisResult(raw_response=raw)
    foods = []
    for item in parsed.get("foods", []):
        food = DetectedFood(
            name=item.get("name", "Alimento desconocido"),
            quantity_g=float(item.get("quantity_g", 100)),
            calories=float(item.get("calories", 0)),
            protein_g=float(item.get("protein_g", 0)),
            carbs_g=float(item.get("carbs_g", 0)),
            fat_g=float(item.get("fat_g", 0)),
            fiber_g=float(item.get("fiber_g", 0)),
            confidence=float(item.get("confidence", 0.85)),
        )
        foods.append(food)
    result.foods = foods
    result.calculate_totals()
    return result


def _clean_json(raw_text: str) -> str:
    if "```" in raw_text:
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
    return raw_text.strip()


class OpenRouterVisionProvider(VisionProvider):
    """Llama 3.2 Vision via OpenRouter — gratis sin tarjeta de crédito."""

    API_URL = "https://openrouter.ai/api/v1/chat/completions"
    MODEL = "meta-llama/llama-3.2-11b-vision-instruct:free"

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> VisionAnalysisResult:
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        payload = {
            "model": self.MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": VISION_PROMPT},
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_b64}"}},
                    ],
                }
            ],
            "max_tokens": 1500,
            "temperature": 0.2,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://nutrivision-ai.vercel.app",
            "X-Title": "NutriVision AI",
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.API_URL, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()

            raw_text = _clean_json(data["choices"][0]["message"]["content"])
            logger.debug(f"OpenRouter Vision raw response: {raw_text}")
            parsed = json.loads(raw_text)
            return _build_result_from_parsed(parsed, raw_text)

        except httpx.HTTPStatusError as e:
            logger.error(f"OpenRouter HTTP error: {e.response.status_code} — {e.response.text}")
            return VisionAnalysisResult(error=f"OpenRouter error: {e.response.status_code}")
        except json.JSONDecodeError as e:
            logger.error(f"OpenRouter JSON parse error: {e}")
            return VisionAnalysisResult(error="No se pudo parsear la respuesta de OpenRouter")
        except Exception as e:
            logger.error(f"OpenRouter unexpected error: {e}")
            return VisionAnalysisResult(error=str(e))


class GeminiVisionProvider(VisionProvider):
    """Google Gemini 1.5 Flash — gratis con cuota diaria."""

    API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> VisionAnalysisResult:
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": VISION_PROMPT},
                        {"inline_data": {"mime_type": mime_type, "data": image_b64}},
                    ]
                }
            ],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1500},
        }

        last_error: Optional[str] = None
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        f"{self.API_URL}?key={self.api_key}",
                        json=payload,
                    )
                    if response.status_code == 429:
                        wait = 5 * (attempt + 1)
                        logger.warning(f"Gemini 429 — retrying in {wait}s (attempt {attempt + 1}/3)")
                        await asyncio.sleep(wait)
                        last_error = "Gemini rate limit (429)"
                        continue
                    response.raise_for_status()
                    data = response.json()

                raw_text = _clean_json(data["candidates"][0]["content"]["parts"][0]["text"])
                logger.debug(f"Gemini Vision raw response: {raw_text}")
                parsed = json.loads(raw_text)
                return _build_result_from_parsed(parsed, raw_text)

            except httpx.HTTPStatusError as e:
                logger.error(f"Gemini HTTP error: {e.response.status_code} — {e.response.text}")
                return VisionAnalysisResult(error=f"Gemini API error: {e.response.status_code}")
            except json.JSONDecodeError as e:
                logger.error(f"Gemini JSON parse error: {e}")
                return VisionAnalysisResult(error="No se pudo parsear la respuesta de Gemini")
            except Exception as e:
                logger.error(f"Gemini unexpected error: {e}")
                return VisionAnalysisResult(error=str(e))

        return VisionAnalysisResult(error=last_error or "Gemini no disponible. Intenta en unos segundos.")


class MockVisionProvider(VisionProvider):
    """Proveedor de prueba — sin API key configurada."""

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> VisionAnalysisResult:
        logger.warning("MockVisionProvider activo — configura OPENROUTER_API_KEY o GEMINI_API_KEY en Railway")
        result = VisionAnalysisResult()
        result.foods = [
            DetectedFood(name="Pollo a la plancha", quantity_g=150, calories=247, protein_g=46.5, carbs_g=0, fat_g=5.5, confidence=0.91),
            DetectedFood(name="Arroz blanco", quantity_g=100, calories=130, protein_g=2.7, carbs_g=28.2, fat_g=0.3, confidence=0.87),
            DetectedFood(name="Ensalada mixta", quantity_g=80, calories=24, protein_g=1.8, carbs_g=4.0, fat_g=0.2, confidence=0.78),
        ]
        result.calculate_totals()
        return result


def get_vision_provider() -> VisionProvider:
    """Prioridad: OpenRouter → Gemini → Mock."""
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip() or (settings.OPENROUTER_API_KEY or "")
    if openrouter_key:
        logger.info("Usando OpenRouter (Llama 3.2 Vision) — gratis")
        return OpenRouterVisionProvider(openrouter_key)

    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip() or (settings.GEMINI_API_KEY or "")
    if gemini_key:
        logger.info("Usando Google Gemini 1.5 Flash Vision")
        return GeminiVisionProvider(gemini_key)

    logger.warning("Sin API key — usando MockVisionProvider")
    return MockVisionProvider()
