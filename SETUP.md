# Guía de instalación local — NutriVision AI

## Estado actual del sistema

| Herramienta | Estado |
|------------|--------|
| Node.js | ✅ v24 instalado |
| npm | ✅ v11 activo |
| Python 3.12 | ❌ Necesita instalarse |
| Docker Desktop | ❌ Necesita instalarse |

---

## 1. Instalar Python 3.12

1. Ir a: **https://www.python.org/downloads/windows/**
2. Descargar **Python 3.12.x** (Windows installer 64-bit)
3. Ejecutar el instalador
4. **IMPORTANTE:** marcar ✅ **"Add Python to PATH"** antes de instalar
5. Verificar en PowerShell:
   ```
   python --version
   # Debe mostrar: Python 3.12.x
   ```

---

## 2. Instalar Docker Desktop

1. Ir a: **https://www.docker.com/products/docker-desktop/**
2. Descargar **Docker Desktop for Windows**
3. Instalar y reiniciar el PC si pide
4. Abrir Docker Desktop y esperar que el ícono de la barra de tareas quede verde (running)
5. Verificar en PowerShell:
   ```
   docker --version
   docker compose version
   ```

---

## 3. Ejecutar el proyecto (después de instalar Python + Docker)

### Opción A — Script automático (recomendado)

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
cd C:\Users\Tecnologia\nutrivision-ai
.\start-local.ps1
```

El script levanta PostgreSQL + Redis en Docker y te indica los próximos pasos.

---

### Opción B — Manual paso a paso

**Abrir 3 terminales en VS Code** (`Ctrl + Shift + \``)

#### Terminal 1 — Base de datos (Docker)
```powershell
cd C:\Users\Tecnologia\nutrivision-ai
docker compose -f docker-compose.local.yml up -d
```
Esto levanta PostgreSQL en `localhost:5432` y Redis en `localhost:6379`.

---

#### Terminal 2 — Backend (FastAPI)
```powershell
cd C:\Users\Tecnologia\nutrivision-ai\backend

# Crear entorno virtual Python
python -m venv venv
venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt

# Crear tablas en la base de datos
alembic upgrade head

# Cargar datos de ejemplo (usuario demo + alimentos)
python ..\scripts\seed.py

# Arrancar el servidor
uvicorn app.main:app --reload --port 8000
```

Verificar: abrir http://localhost:8000/docs — debe mostrar la documentación Swagger.

---

#### Terminal 3 — Frontend (Next.js)
```powershell
cd C:\Users\Tecnologia\nutrivision-ai\frontend

# Las dependencias ya están instaladas, solo ejecutar:
npm run dev
```

---

## 4. URLs para abrir en el navegador

| URL | Descripción |
|-----|-------------|
| **http://localhost:3000** | Aplicación web (frontend) |
| http://localhost:8000/docs | Documentación API Swagger |
| http://localhost:8000/api/v1/health | Health check del backend |

---

## 5. Usuario de prueba

Después de ejecutar `seed.py`:

- **Email:** `demo@nutrivision.ai`
- **Contraseña:** `demo1234`

---

## 6. Detener el proyecto

```powershell
# Detener Docker (PostgreSQL + Redis)
docker compose -f docker-compose.local.yml down

# Las terminales de backend y frontend: Ctrl+C en cada una
```

---

## 7. Solución de problemas comunes

**npm no funciona en PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

**Error de conexión a la base de datos:**
- Verificar que Docker Desktop esté corriendo (ícono verde en la barra de tareas)
- Ejecutar: `docker ps` — debe mostrar `nutrivision_postgres` y `nutrivision_redis`

**Puerto 8000 o 3000 en uso:**
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :8000
# Matar el proceso (reemplazar PID)
taskkill /PID <PID> /F
```

**Frontend no conecta con backend:**
- Verificar que `frontend\.env.local` contiene: `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`
- Verificar que el backend esté corriendo en el puerto 8000

**Sin token de LogMeal:**
- La app funciona igual usando datos simulados (MockVisionProvider)
- Para análisis real: obtener token gratis en https://api.logmeal.com y agregarlo a `backend\.env`
