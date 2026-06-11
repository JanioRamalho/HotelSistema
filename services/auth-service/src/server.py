from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from urllib import request as urlrequest
from urllib.error import URLError, HTTPError
import hashlib
import json
import os
import random
import smtplib
import sys
import uuid

from flask import Flask, request

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from services.common_py.env import load_root_env
from services.common_py.http import add_cors_headers, json_response
from services.common_py.sqlite_client import connect, database_path, initialize_database


load_root_env()
initialize_database()

app = Flask(__name__)
PORT = int(os.environ.get("PORT", "4201"))
SERVICE_NAME = os.environ.get("SERVICE_NAME", "auth-service")
VALIDATION_SERVICE_URL = os.environ.get("VALIDATION_SERVICE_URL", "http://localhost:4205")
EMAIL_PROVIDER = os.environ.get("EMAIL_PROVIDER", "console")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "Viajei <onboarding@resend.dev>")
EXTERNAL_TIMEOUT = int(os.environ.get("EXTERNAL_REQUEST_TIMEOUT_MS", "5000")) / 1000


@app.after_request
def cors(response):
    return add_cors_headers(response)


def utc_iso(minutes=0):
    return (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat().replace("+00:00", "Z")


def hash_code(code):
    return hashlib.sha256(str(code).encode("utf-8")).hexdigest()


def hash_password(password):
    return hashlib.sha256(f"hotel-sistema:{password}".encode("utf-8")).hexdigest()


def row_to_user(row):
    if not row:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "email_verified_at": row["email_verified_at"],
    }


def find_user_by_email(conn, email):
    return conn.execute(
        """
        SELECT id, nome AS name, email, email_verificado_em AS email_verified_at,
               avatar_url, senha_hash AS password_hash, telefone AS phone,
               documento AS document, criado_em AS created_at, atualizado_em AS updated_at
        FROM usuarios
        WHERE email = ?
        """,
        (email,),
    ).fetchone()


def find_user_by_id(conn, user_id):
    return conn.execute(
        """
        SELECT id, nome AS name, email, email_verificado_em AS email_verified_at,
               avatar_url, senha_hash AS password_hash, telefone AS phone,
               documento AS document, criado_em AS created_at, atualizado_em AS updated_at
        FROM usuarios
        WHERE id = ?
        """,
        (user_id,),
    ).fetchone()


def http_post_json(url, payload):
    body = json.dumps(payload).encode("utf-8")
    req = urlrequest.Request(url, data=body, method="POST", headers={"accept": "application/json", "content-type": "application/json"})
    with urlrequest.urlopen(req, timeout=EXTERNAL_TIMEOUT) as response:
        return response.status, json.loads(response.read().decode("utf-8") or "{}")


def validate_registration(payload):
    try:
        status, body = http_post_json(
            f"{VALIDATION_SERVICE_URL}/validate/reservation-guest",
            {
                "name": payload.get("name"),
                "email": payload.get("email"),
                "phone": payload.get("phone"),
                "cpf": payload.get("document"),
                "cep": payload.get("zipCode"),
                "birthdate": payload.get("birthdate"),
                "minimumAge": 18,
            },
        )
    except HTTPError as error:
        body = json.loads(error.read().decode("utf-8") or "{}")
        status = error.code
    except (URLError, TimeoutError, OSError):
        return False, 502, {"error": "validation_service_unavailable", "message": "Servico Python de validacao indisponivel."}, {}

    if status >= 400 or body.get("valid") is False:
        return False, 422, {"error": "invalid_register_data", "message": "Revise os dados do cadastro.", "details": body.get("errors", [])}, {}
    return True, 200, {}, body.get("normalized") or {}


def create_email_html(code):
    return f"<h2>Codigo de verificacao</h2><p>Use o codigo abaixo para confirmar seu login no Viajei:</p><p style=\"font-size: 28px; font-weight: 700; letter-spacing: 4px;\">{code}</p><p>Este codigo expira em 10 minutos.</p>"


def send_verification_email(email, code):
    if SMTP_HOST and SMTP_USER and SMTP_PASS:
        message = EmailMessage()
        message["From"] = EMAIL_FROM
        message["To"] = email
        message["Subject"] = "Codigo de verificacao do Viajei"
        message.set_content(f"Codigo de verificacao do Viajei: {code}\n\nEste codigo expira em 10 minutos.")
        message.add_alternative(create_email_html(code), subtype="html")
        smtp_class = smtplib.SMTP_SSL if SMTP_PORT == 465 else smtplib.SMTP
        with smtp_class(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
            if SMTP_PORT != 465:
                smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASS)
            smtp.send_message(message)
        return {"provider": "smtp", "delivered": True}

    if EMAIL_PROVIDER != "resend" or not RESEND_API_KEY:
        print(json.dumps({"service": SERVICE_NAME, "event": "email_code_console_fallback", "email": email, "code": code}))
        return {"provider": "console", "delivered": False}

    payload = {"from": EMAIL_FROM, "to": email, "subject": "Codigo de verificacao do Viajei", "html": create_email_html(code)}
    req = urlrequest.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={"authorization": f"Bearer {RESEND_API_KEY}", "content-type": "application/json"},
    )
    with urlrequest.urlopen(req, timeout=EXTERNAL_TIMEOUT) as response:
        if response.status >= 400:
            raise RuntimeError(response.read().decode("utf-8"))
    return {"provider": "resend", "delivered": True}


def activate_wallet(conn, user_id):
    conn.execute("INSERT OR IGNORE INTO carteiras (usuario_id, saldo_centavos) VALUES (?, 2000000)", (user_id,))


@app.get("/health")
def health():
    return json_response({"status": "ok", "service": SERVICE_NAME, "port": PORT, "databasePath": str(database_path()), "mode": "demo"})


@app.post("/password/register")
def password_register():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email") or "").strip().lower()
    name = str(payload.get("name") or "").strip()
    password = str(payload.get("password") or "")

    if not name or not email or len(password) < 8:
        return json_response({"error": "invalid_register_data", "message": "Informe nome, e-mail e senha com pelo menos 8 caracteres."}, 400)

    valid, status, error_payload, normalized = validate_registration({**payload, "email": email, "name": name})
    if not valid:
        return json_response(error_payload, status)

    with connect() as conn:
        existing = find_user_by_email(conn, email)
        if existing and existing["password_hash"]:
            return json_response({"error": "email_already_registered", "message": "Este e-mail ja possui senha cadastrada."}, 409)

        pending_id = str(uuid.uuid4())
        code = str(random.randint(100000, 999999))
        expires_at = utc_iso(10)
        conn.execute("DELETE FROM cadastros_pendentes WHERE email = ?", (email,))
        conn.execute(
            "INSERT INTO cadastros_pendentes (id, nome, email, senha_hash, telefone, documento, codigo_hash, expira_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (pending_id, name, email, hash_password(password), normalized.get("phone"), normalized.get("cpf"), hash_code(code), expires_at),
        )
        conn.commit()

    try:
        delivery = send_verification_email(email, code)
    except Exception as error:
        with connect() as conn:
            conn.execute("DELETE FROM cadastros_pendentes WHERE id = ?", (pending_id,))
            conn.commit()
        return json_response({"error": "email_delivery_failed", "message": str(error)}, 502)

    return json_response({"data": {"pendingRegistrationId": pending_id, "email": email, "expiresAt": expires_at, "delivery": delivery, "requiresEmailVerification": True}}, 202)


@app.post("/password/register/confirm")
def password_register_confirm():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email") or "").strip().lower()
    code_hash = hash_code(str(payload.get("code") or "").strip())

    with connect() as conn:
        pending = conn.execute("SELECT * FROM cadastros_pendentes WHERE email = ? AND codigo_hash = ? LIMIT 1", (email, code_hash)).fetchone()
        if not pending or datetime.fromisoformat(str(pending["expira_em"]).replace("Z", "+00:00")).timestamp() < datetime.now(timezone.utc).timestamp():
            if email:
                conn.execute("UPDATE cadastros_pendentes SET tentativas = tentativas + 1 WHERE email = ?", (email,))
                conn.commit()
            return json_response({"error": "invalid_or_expired_code", "message": "Codigo invalido ou expirado."}, 400)

        existing = find_user_by_email(conn, email)
        if existing and existing["password_hash"]:
            conn.execute("DELETE FROM cadastros_pendentes WHERE id = ?", (pending["id"],))
            conn.commit()
            return json_response({"error": "email_already_registered", "message": "Este e-mail ja possui senha cadastrada."}, 409)

        user_id = existing["id"] if existing else str(uuid.uuid4())
        if existing:
            conn.execute("UPDATE usuarios SET nome = ?, senha_hash = ?, telefone = ?, documento = ?, email_verificado_em = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?", (pending["nome"], pending["senha_hash"], pending["telefone"], pending["documento"], user_id))
        else:
            conn.execute("INSERT INTO usuarios (id, nome, email, email_verificado_em, senha_hash, telefone, documento) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)", (user_id, pending["nome"], pending["email"], pending["senha_hash"], pending["telefone"], pending["documento"]))
        conn.execute("DELETE FROM cadastros_pendentes WHERE id = ?", (pending["id"],))
        activate_wallet(conn, user_id)
        conn.commit()
        user = row_to_user(find_user_by_id(conn, user_id))
    return json_response({"data": {"user": user, "walletBonusCents": 2000000}}, 201)


@app.post("/password/login")
def password_login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email") or "").strip().lower()
    password = str(payload.get("password") or "")
    with connect() as conn:
        user = find_user_by_email(conn, email)
        if not user or not user["password_hash"] or user["password_hash"] != hash_password(password):
            return json_response({"error": "invalid_credentials", "message": "E-mail ou senha invalidos."}, 401)
        if not user["email_verified_at"]:
            return json_response({"error": "email_not_verified", "message": "Confirme o codigo enviado no cadastro antes de entrar."}, 403)
        activate_wallet(conn, user["id"])
        conn.commit()
        public = row_to_user(user)
    return json_response({"data": {"user": public, "walletBonusCents": 2000000}})


@app.post("/email/verify-code")
def email_verify_code():
    payload = request.get_json(silent=True) or {}
    code_hash = hash_code(payload.get("code"))
    with connect() as conn:
        record = conn.execute("SELECT * FROM verificacoes_email WHERE email = ? AND codigo_hash = ? AND consumido_em IS NULL ORDER BY criado_em DESC LIMIT 1", (payload.get("email"), code_hash)).fetchone()
        if not record or datetime.fromisoformat(str(record["expira_em"]).replace("Z", "+00:00")).timestamp() < datetime.now(timezone.utc).timestamp():
            return json_response({"error": "invalid_or_expired_code"}, 400)
        conn.execute("UPDATE verificacoes_email SET consumido_em = CURRENT_TIMESTAMP WHERE id = ?", (record["id"],))
        conn.execute("UPDATE usuarios SET email_verificado_em = CURRENT_TIMESTAMP WHERE id = ?", (record["usuario_id"],))
        activate_wallet(conn, record["usuario_id"])
        conn.commit()
        user = row_to_user(find_user_by_id(conn, record["usuario_id"]))
    return json_response({"data": {"verified": True, "user": user, "walletBonusCents": 2000000}})


@app.errorhandler(404)
def not_found(_error):
    return json_response({"error": "not_found"}, 404)


if __name__ == "__main__":
    print(f"{SERVICE_NAME} listening on http://localhost:{PORT}")
    print(json.dumps({"service": SERVICE_NAME, "event": "auth_config", "emailProvider": "smtp" if SMTP_HOST and SMTP_USER and SMTP_PASS else ("resend" if EMAIL_PROVIDER == "resend" and RESEND_API_KEY else "console"), "smtpConfigured": bool(SMTP_HOST and SMTP_USER and SMTP_PASS)}))
    app.run(host="0.0.0.0", port=PORT, threaded=True)

