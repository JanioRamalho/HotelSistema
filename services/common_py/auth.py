from datetime import datetime, timedelta, timezone
import os

import jwt


# Helper compartilhado de autenticacao JWT usado por auth-service e booking-service.
# O auth-service cria tokens; os servicos protegidos validam o Bearer token recebido.
ALGORITHM = "HS256"


def _token_secret() -> str:
    return os.environ.get("AUTH_TOKEN_SECRET", "dev-secret-change-me-32-bytes-minimum")


def create_access_token(user_id: str, email: str, expires_in_seconds: int = 60 * 60 * 8) -> str:
    # Token assinado com expiracao para identificar o usuario nas chamadas protegidas.
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(seconds=expires_in_seconds),
    }
    return jwt.encode(payload, _token_secret(), algorithm=ALGORITHM)


def verify_access_token(token: str):
    # Retorna o payload se o token for valido; caso contrario, bloqueia sem excecao.
    try:
        return jwt.decode(token, _token_secret(), algorithms=[ALGORITHM])
    except jwt.InvalidTokenError:
        return None


def bearer_token_from_header(authorization: str) -> str:
    prefix = "Bearer "
    if not authorization or not authorization.startswith(prefix):
        return ""
    return authorization[len(prefix):].strip()
