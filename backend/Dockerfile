FROM python:3.12-slim

WORKDIR /app

# System dependencies for psycopg (binary wheel) and Pillow
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Non-root user for security
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Railway injects $PORT; default to 8000 for local Docker
EXPOSE 8000

# Migrations are run via railway.toml startCommand before this CMD
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
