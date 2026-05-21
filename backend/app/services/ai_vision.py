"""
AI Vision Service — OpenAI GPT-4o Vision como proveedor principal.
Adapter pattern: swap de proveedor sin tocar endpoints.

Proveedores disponibles:
  - OpenAIVisionProvider  (GPT-4o, recomendado)
  - MockVisionProvider    (datos simulados, sin API key)
"""
import httpx
import base64
import json
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


OPENAI_PROMPT = """Analiza esta imagen de comida y devuelve un JSON con los alimentos detectados.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin texto extra):
{
  "foods": [
    {
      "name": "nombre del alimento en español",
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

Instrucciones:
- Detecta TODOS los alimentos visibles en el plato
- Estima los gramos de cada alimento por su tamaño visual
- Calcula las calorías y macros basándote en los gramos estimados
- confidence: número entre 0 y 1 indicando qué tan seguro estás
- Usa nombres de alimentos en español
- Si no puedes identificar un alimento, nómbralo descriptivamente
"""


class OpenAIVisionProvider(VisionProvider):
    """GPT-4o Vision — análisis de alimentos con IA avanzada."""

    API_URL = "https://api.openai.com/v1/chat/completions"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> VisionAnalysisResult:
        try:
            # Codificar imagen en base64
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")
            data_url = f"data:{mime_type};base64,{image_b64}"

            payload = {
                "model": "gpt-4o",
                "max_tokens": 1000,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": OPENAI_PROMPT},
                            {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
                        ],
                    }
                ],
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.API_URL, headers=self.headers, json=payload)
                response.raise_for_status()
                data = response.json()

            raw_text = data["choices"][0]["message"]["content"].strip()
            logger.debug(f"OpenAI Vision raw response: {raw_text}")

            # Limpiar posible markdown code block
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]

            parsed = json.loads(raw_text)
            return self._build_result(parsed, raw_text)

        except httpx.HTTPStatusError as e:
            logger.error(f"OpenAI API HTTP error: {e.response.status_code} — {e.response.text}")
            return VisionAnalysisResult(error=f"OpenAI API error: {e.response.status_code}")
        except json.JSONDecodeError as e:
            logger.error(f"OpenAI response JSON parse error: {e}")
            return VisionAnalysisResult(error="No se pudo parsear la respuesta de OpenAI")
        except Exception as e:
            logger.error(f"OpenAI Vision unexpected error: {e}")
            return VisionAnalysisResult(error=str(e))

    def _build_result(self, parsed: dict, raw: str) -> VisionAnalysisResult:
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


class MockVisionProvider(VisionProvider):
    """Proveedor de prueba — sin API key configurada."""

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> VisionAnalysisResult:
        logger.warning("MockVisionProvider activo — agrega OPENAI_API_KEY en backend/.env para análisis real")
        result = VisionAnalysisResult()
        result.foods = [
            DetectedFood(
                name="Pollo a la plancha",
                quantity_g=150,
                calories=247,
                protein_g=46.5,
                carbs_g=0,
                fat_g=5.5,
                confidence=0.91,
            ),
            DetectedFood(
                name="Arroz blanco",
                quantity_g=100,
                calories=130,
                protein_g=2.7,
                carbs_g=28.2,
                fat_g=0.3,
                confidence=0.87,
            ),
            DetectedFood(
                name="Ensalada mixta",
                quantity_g=80,
                calories=24,
                protein_g=1.8,
                carbs_g=4.0,
                fat_g=0.2,
                confidence=0.78,
            ),
        ]
        result.calculate_totals()
        return result


def get_vision_provider() -> VisionProvider:
    """Selecciona el proveedor según las API keys disponibles."""
    if settings.OPENAI_API_KEY:
        logger.info("Usando OpenAI GPT-4o Vision")
        return OpenAIVisionProvider(settings.OPENAI_API_KEY)
    logger.warning("Sin API key — usando MockVisionProvider")
    return MockVisionProvider()
