from pathlib import Path
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError
from uuid import uuid4
import json
import os
import sys

from flask import Flask, request

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from services.common_py.env import load_root_env
from services.common_py.http import add_cors_headers, json_response
from services.common_py.sqlite_client import connect, database_path, initialize_database


load_root_env()
initialize_database()

app = Flask(__name__)
PORT = int(os.environ.get("PORT", "4202"))
SERVICE_NAME = os.environ.get("SERVICE_NAME", "booking-service")
VALIDATION_SERVICE_URL = os.environ.get("VALIDATION_SERVICE_URL", "http://localhost:4205")


@app.after_request
def cors(response):
    return add_cors_headers(response)


def authenticated_user_id():
    user_id = request.headers.get("x-user-id", "").strip()
    return user_id or None


def nights_between(check_in, check_out):
    from datetime import datetime

    try:
        start = datetime.strptime(f"{check_in}T00:00:00", "%Y-%m-%dT%H:%M:%S")
        end = datetime.strptime(f"{check_out}T00:00:00", "%Y-%m-%dT%H:%M:%S")
    except ValueError:
        return 0
    return max(0, (end - start).days)


def validate_guest(payload):
    body = json.dumps({
        "name": payload.get("guestName"),
        "email": payload.get("guestEmail"),
        "phone": payload.get("guestPhone"),
        "cpf": payload.get("guestDocument"),
        "cep": payload.get("guestZipCode"),
        "birthdate": payload.get("guestBirthdate"),
        "minimumAge": 18,
    }).encode("utf-8")
    req = urlrequest.Request(f"{VALIDATION_SERVICE_URL}/validate/reservation-guest", data=body, method="POST", headers={"accept": "application/json", "content-type": "application/json"})
    try:
        with urlrequest.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8") or "{}")
            return True, 200, data
    except HTTPError as error:
        data = json.loads(error.read().decode("utf-8") or "{}")
        return False, 422, data
    except (URLError, TimeoutError, OSError):
        return False, 502, {"error": "validation_service_unavailable", "message": "Servico Python de validacao indisponivel."}


def wallet(conn, user_id):
    return conn.execute("SELECT usuario_id AS user_id, saldo_centavos AS balance_cents FROM carteiras WHERE usuario_id = ?", (user_id,)).fetchone()


@app.get("/health")
def health():
    return json_response({"status": "ok", "service": SERVICE_NAME, "port": PORT, "databasePath": str(database_path())})


@app.get("/wallet/me")
def wallet_me():
    user_id = authenticated_user_id()
    if not user_id:
        return json_response({"error": "login_required", "message": "Faca login para acessar sua carteira demo."}, 401)
    with connect() as conn:
        row = wallet(conn, user_id)
    if not row:
        return json_response({"error": "wallet_not_found", "message": "Carteira demo nao encontrada para esta conta."}, 404)
    return json_response({"data": dict(row)})


@app.get("/bookings/me")
def bookings_me():
    user_id = authenticated_user_id()
    if not user_id:
        return json_response({"error": "login_required", "message": "Faca login para ver suas reservas."}, 401)
    with connect() as conn:
        data = [dict(row) for row in conn.execute(
            """
            SELECT b.id, b.usuario_id AS user_id, b.hotel_id, b.quarto_id AS room_id,
                   b.check_in, b.check_out, b.hospedes AS guests, b.preco_total AS total_price,
                   b.status, b.nome_hospede AS guest_name, b.email_hospede AS guest_email,
                   b.telefone_hospede AS guest_phone, b.documento_hospede AS guest_document,
                   b.pedidos_especiais AS special_requests, b.criado_em AS created_at,
                   h.nome AS hotel_name, q.nome AS room_name
            FROM reservas b
            JOIN hoteis h ON h.id = b.hotel_id
            JOIN quartos q ON q.id = b.quarto_id
            WHERE b.usuario_id = ?
            ORDER BY b.criado_em DESC
            """,
            (user_id,),
        ).fetchall()]
    return json_response({"data": data})


@app.post("/bookings")
def create_booking():
    user_id = authenticated_user_id()
    if not user_id:
        return json_response({"error": "login_required", "message": "Faca login para concluir sua reserva demo."}, 401)
    payload = request.get_json(silent=True) or {}
    with connect() as conn:
        room = conn.execute(
            "SELECT q.id, q.hotel_id, q.preco AS price, q.capacidade AS capacity, h.nome AS hotel_name FROM quartos q JOIN hoteis h ON h.id = q.hotel_id WHERE q.id = ?",
            (payload.get("roomId"),),
        ).fetchone()
        if not room:
            return json_response({"error": "room_not_found"}, 404)
        nights = nights_between(payload.get("checkIn"), payload.get("checkOut"))
        if nights <= 0:
            return json_response({"error": "invalid_dates", "message": "Check-out deve ser depois do check-in."}, 400)
        guests = int(payload.get("guests") or 1)
        if guests > room["capacity"]:
            return json_response({"error": "room_capacity_exceeded"}, 400)
        valid, status, validation = validate_guest(payload)
        if not valid:
            if status == 422:
                return json_response({"error": "invalid_guest_data", "message": "Revise os dados do hospede antes de concluir a reserva.", "details": validation.get("errors", [])}, 422)
            return json_response(validation, status)
        user_wallet = wallet(conn, user_id)
        if not user_wallet:
            return json_response({"error": "wallet_not_found"}, 404)
        total_cents = int(room["price"] * nights * 100)
        if user_wallet["balance_cents"] < total_cents:
            return json_response({"error": "insufficient_demo_balance"}, 409)
        booking_id = str(uuid4())
        transaction_id = str(uuid4())
        normalized = validation.get("normalized") or {}
        conn.execute(
            """
            INSERT INTO reservas (
              id, usuario_id, hotel_id, quarto_id, check_in, check_out, hospedes, preco_total, status,
              nome_hospede, email_hospede, telefone_hospede, documento_hospede, pedidos_especiais
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?)
            """,
            (booking_id, user_id, room["hotel_id"], room["id"], payload.get("checkIn"), payload.get("checkOut"), guests, total_cents / 100, normalized.get("name"), normalized.get("email"), normalized.get("phone"), normalized.get("cpf"), payload.get("specialRequests")),
        )
        conn.execute("UPDATE carteiras SET saldo_centavos = saldo_centavos - ?, atualizado_em = CURRENT_TIMESTAMP WHERE usuario_id = ?", (total_cents, user_id))
        conn.execute("INSERT INTO transacoes_carteira (id, usuario_id, reserva_id, tipo, valor_centavos, descricao) VALUES (?, ?, ?, 'debit', ?, ?)", (transaction_id, user_id, booking_id, total_cents, f"Reserva demo em {room['hotel_name']}"))
        conn.commit()
        remaining = user_wallet["balance_cents"] - total_cents
    return json_response({"data": {"bookingId": booking_id, "userId": user_id, "hotelId": room["hotel_id"], "roomId": room["id"], "nights": nights, "totalCents": total_cents, "remainingBalanceCents": remaining}}, 201)


@app.errorhandler(404)
def not_found(_error):
    return json_response({"error": "not_found"}, 404)


if __name__ == "__main__":
    print(f"{SERVICE_NAME} listening on http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, threaded=True)
