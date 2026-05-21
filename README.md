# NutriVision AI 🥗

> AI-powered nutrition tracking SaaS — foto tu plato y obtén macros instantáneamente.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui |
| State | Zustand + TanStack Query |
| Charts | Recharts |
| Backend | FastAPI (Python), SQLAlchemy 2.0, Alembic |
| DB | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens) |
| AI Vision | LogMeal API (adapter pattern → OpenAI Vision ready) |
| Infra | Docker, Docker Compose |

---

## Quick Start

### Prerequisitos
- Docker Desktop
- Node.js 20+
- Python 3.12+

### 1. Clonar y configurar entorno

```bash
git clone <repo>
cd nutrivision-ai

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Edita `backend/.env` con tus valores reales (especialmente `LOGMEAL_API_TOKEN`).

### 2. Levantar con Docker Compose

```bash
# Producción
docker compose up -d

# Desarrollo (con hot reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

La app estará disponible en:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### 3. Seed de base de datos (opcional)

```bash
cd backend
python ../scripts/seed.py
# Usuario demo: demo@nutrivision.ai / demo1234
```

---

## Desarrollo local sin Docker

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL local

# Migraciones
alembic upgrade head

# Seed
python ../scripts/seed.py

# Servidor
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## Arquitectura

```
nutrivision-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Routers FastAPI
│   │   ├── core/               # Config, seguridad, deps
│   │   ├── db/                 # Engine, session, base
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── repositories/       # Data access layer
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   │   ├── ai_vision.py    # LogMeal + adapter pattern
│   │   │   └── nutrition.py    # Mifflin-St Jeor, TDEE, macros
│   │   └── main.py
│   └── alembic/                # DB migrations
├── frontend/
│   └── src/
│       ├── app/                # Next.js 15 App Router
│       ├── components/         # React components
│       ├── hooks/              # React Query hooks
│       ├── services/           # API client services
│       ├── stores/             # Zustand stores
│       └── types/              # TypeScript types
├── scripts/
│   ├── init.sql                # DB init
│   └── seed.py                 # Data seed
└── docker-compose.yml
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Registro |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Renovar token |
| GET | `/api/v1/auth/me` | Usuario actual |

### Profile (requiere JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/profile` | Crear perfil (onboarding) |
| GET | `/api/v1/profile` | Obtener perfil |
| PATCH | `/api/v1/profile` | Actualizar perfil |

### Meals (requiere JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/meals/analyze` | Analizar imagen con IA |
| GET | `/api/v1/meals/today` | Comidas de hoy |
| GET | `/api/v1/meals/date/{date}` | Comidas por fecha |
| GET | `/api/v1/meals/{id}` | Detalle de comida |
| PATCH | `/api/v1/meals/{id}/items/{item_id}` | Editar item |
| DELETE | `/api/v1/meals/{id}/items/{item_id}` | Eliminar item |
| DELETE | `/api/v1/meals/{id}` | Eliminar comida |

### Macros (requiere JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/macros/today` | Macros del día |
| GET | `/api/v1/macros/weekly` | Progreso semanal |
| GET | `/api/v1/macros/recommendations` | Recomendaciones IA |

---

## Fórmulas nutricionales

### TMB — Mifflin-St Jeor
- **Hombre:** `(10 × kg) + (6.25 × cm) - (5 × edad) + 5`
- **Mujer:** `(10 × kg) + (6.25 × cm) - (5 × edad) - 161`

### TDEE
`TDEE = TMB × factor_actividad`

### Ajuste calórico por objetivo
| Objetivo | Ajuste |
|----------|--------|
| Perder grasa | -500 kcal |
| Mantener | 0 kcal |
| Ganar músculo | +300 kcal |

---

## Extender a OpenAI Vision

En `backend/app/services/ai_vision.py`, implementa:

```python
class OpenAIVisionProvider(VisionProvider):
    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> VisionAnalysisResult:
        # Usar GPT-4o con base64 image
        ...
```

Y cambia `get_vision_provider()` para retornar la nueva clase.

---

## Roadmap futuro

- [ ] React Native app (API ya preparada)
- [ ] Integración wearables / Apple Health
- [ ] Modelo propio de detección de alimentos
- [ ] Modo freemium con Stripe
- [ ] Soporte multilenguaje (i18n) — locale ya guardado en Profile
- [ ] Sistema de notificaciones push
- [ ] Exportar datos PDF/CSV
- [ ] Escáner de código de barras

---

## Seguridad

- JWT con refresh token rotation
- Rate limiting (SlowAPI)
- Validación de imágenes (tipo MIME + tamaño)
- Sanitización de inputs con Pydantic
- CORS configurado
- No-root Docker containers
- Secrets via variables de entorno

---

## Licencia

MIT — Construido con FastAPI + Next.js 15
