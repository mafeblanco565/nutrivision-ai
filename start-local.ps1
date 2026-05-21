# ============================================================
# NutriVision AI — Start local development
# Requiere: Docker Desktop instalado y corriendo
# ============================================================

Write-Host ""
Write-Host "NutriVision AI — Iniciando entorno local..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Docker
$dockerRunning = $false
try {
    $null = docker info 2>$null
    $dockerRunning = $true
} catch {}

if (-not $dockerRunning) {
    Write-Host "[ERROR] Docker Desktop no esta corriendo." -ForegroundColor Red
    Write-Host "Descargalo desde: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Una vez instalado Docker, ejecuta este script de nuevo." -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Levantando PostgreSQL y Redis en Docker..." -ForegroundColor Green
docker compose -f docker-compose.local.yml up -d

Write-Host ""
Write-Host "[2/3] Esperando que PostgreSQL este listo..." -ForegroundColor Green
$retries = 0
do {
    Start-Sleep -Seconds 2
    $ready = docker exec nutrivision_postgres pg_isready -U nutrivision -d nutrivision_db 2>$null
    $retries++
} while ($LASTEXITCODE -ne 0 -and $retries -lt 15)

if ($retries -ge 15) {
    Write-Host "[ERROR] PostgreSQL no respondio a tiempo." -ForegroundColor Red
    exit 1
}

Write-Host "[3/3] Base de datos lista." -ForegroundColor Green
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  PROXIMOS PASOS (abre 2 terminales)  " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "TERMINAL 1 — Backend (FastAPI):" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  python -m venv venv" -ForegroundColor White
Write-Host "  venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  pip install -r requirements.txt" -ForegroundColor White
Write-Host "  alembic upgrade head" -ForegroundColor White
Write-Host "  python ..\scripts\seed.py" -ForegroundColor White
Write-Host "  uvicorn app.main:app --reload --port 8000" -ForegroundColor White
Write-Host ""
Write-Host "TERMINAL 2 — Frontend (Next.js):" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "URLS:" -ForegroundColor Green
Write-Host "  Web App   -> http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API Docs  -> http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  API Base  -> http://localhost:8000/api/v1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Usuario demo: demo@nutrivision.ai / demo1234" -ForegroundColor Magenta
