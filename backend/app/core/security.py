import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Union

import bcrypt
import httpx
from jose import JWTError, jwt
from jose import jwk as jose_jwk

from app.core.config import settings

# ── Legacy JWT helpers (kept for any internal tokens) ────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(subject: Union[str, int], expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": str(subject), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: Union[str, int]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(subject), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# ── Supabase JWKS verification (ECC P-256) ───────────────────────────────────

_jwks_cache: dict = {"keys": [], "fetched_at": 0.0}
_JWKS_TTL = 3600.0  # refresh every hour


async def refresh_supabase_jwks() -> bool:
    """Fetch JWKS from Supabase and cache them. Returns True on success."""
    if not settings.SUPABASE_URL:
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
            )
            resp.raise_for_status()
            keys = resp.json().get("keys", [])
            _jwks_cache["keys"] = keys
            _jwks_cache["fetched_at"] = time.time()
            return bool(keys)
    except Exception:
        return False


def verify_supabase_token(token: str) -> Optional[dict]:
    """Verify a Supabase JWT using cached JWKS (ES256 or HS256)."""
    keys = _jwks_cache.get("keys", [])
    if not keys:
        return None

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        alg = header.get("alg", "ES256")

        for key_data in keys:
            if key_data.get("kid") == kid:
                public_key = jose_jwk.construct(key_data, algorithm=alg)
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=[alg],
                    audience="authenticated",
                )
                return payload
        return None
    except JWTError:
        return None
