from pathlib import Path
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError
from uuid import uuid4
import json
import logging
import os
import sys

from flask import Flask, request

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from services.common_py.env import load_root_env
from services.common_py.auth import bearer_token_from_header, verify_access_token
from services.common_py.http import add_cors_headers, json_response
from services.common_py.sqlite_client import connect, database_path, initialize_database


# Booking Service: concentra carteira demo, criacao de reservas e cancelamentos.
# Todas as rotas de usuario validam JWT recebido pelo Gateway.
load_root_env()
initialize_database()

logging.getLogger("werkzeug").setLevel(logging.ERROR)

app = Flask(__name__)
PORT = int(os.environ.get("PORT", "4202"))
SERVICE_NAME = os.environ.get("SERVICE_NAME", "booking-service")
VALIDATION_SERVICE_URL = os.environ.get("VALIDATION_SERVICE_URL", "http://localhost:4205")


@app.after_request
def cors(response):
    return add_cors_headers(response)


def authenticated_user_id():
    # Extrai o usuario do token JWT para proteger carteira e reservas.
    token = bearer_token_from_header(request.headers.get("authorization", ""))
    payload = verify_access_token(token)
    return payload.get("sub") if payload else None


def nights_between(check_in, check_out):
    from datetime import datetime

    try:
        start = datetime.strptime(f"{check_in}T00:00:00", "%Y-%m-%dT%H:%M:%S")
        end = datetime.strptime(f"{check_out}T00:00:00", "%Y-%m-%dT%H:%M:%S")
    except ValueError:
        return 0
    return max(0, (end - start).days)


def validate_guest(payload):
    # Delegacao para o validation-service: reserva so avanca com hospede valido.
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


def find_room(conn, room_id):
    return conn.execute(
        "SELECT q.id, q.hotel_id, q.preco AS price, q.capacidade AS capacity, h.nome AS hotel_name FROM quartos q JOIN hoteis h ON h.id = q.hotel_id WHERE q.id = ?",
        (room_id,),
    ).fetchone()


def ensure_demo_room(conn, payload):
    # Permite reservar quartos vindos do catalogo dummy, persistindo um registro minimo.
    hotel = payload.get("hotel") or {}
    room = payload.get("room") or {}
    if not hotel or not room or not room.get("id"):
        return None

    hotel_id = hotel.get("id") or f"demo-hotel-{hotel.get('slug') or room.get('id')}"
    conn.execute(
        """
        INSERT OR IGNORE INTO hoteis (
          id, nome, slug, descricao, descricao_curta, endereco, cidade, estado, pais, cep,
          latitude, longitude, estrelas, nota, quantidade_avaliacoes, preco_inicial,
          politica_check_in, politica_check_out, politica_cancelamento, politica_pets, politica_criancas,
          contato_telefone, contato_email, contato_site
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            hotel_id,
            hotel.get("name") or "Hotel demo",
            hotel.get("slug") or hotel_id,
            hotel.get("description") or "Hotel demo gerado a partir do catalogo.",
            hotel.get("shortDescription") or hotel.get("description") or "Hotel demo.",
            hotel.get("address") or "",
            hotel.get("city") or "",
            hotel.get("state") or "",
            hotel.get("country") or "Brasil",
            hotel.get("zipCode") or "",
            hotel.get("latitude") or 0,
            hotel.get("longitude") or 0,
            hotel.get("stars") or 3,
            hotel.get("rating") or 0,
            hotel.get("reviewCount") or 0,
            hotel.get("priceFrom") or room.get("price") or 0,
            (hotel.get("policies") or {}).get("checkIn") or "14:00",
            (hotel.get("policies") or {}).get("checkOut") or "12:00",
            (hotel.get("policies") or {}).get("cancellation") or "",
            (hotel.get("policies") or {}).get("pets") or "",
            (hotel.get("policies") or {}).get("children") or "",
            (hotel.get("contact") or {}).get("phone") or "",
            (hotel.get("contact") or {}).get("email") or "",
            (hotel.get("contact") or {}).get("website"),
        ),
    )
    conn.execute(
        """
        INSERT OR IGNORE INTO quartos (
          id, hotel_id, nome, descricao, categoria, preco, capacidade, tamanho, disponivel
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        """,
        (
            room.get("id"),
            hotel_id,
            room.get("name") or "Quarto demo",
            room.get("description") or "Quarto demo gerado a partir do catalogo.",
            room.get("category") if room.get("category") in ("economic", "standard", "luxury") else "standard",
            room.get("price") or 0,
            room.get("capacity") or 1,
            room.get("size") or 0,
        ),
    )
    return find_room(conn, room.get("id"))


@app.get("/health")
def health():
    return json_response({"status": "ok", "service": SERVICE_NAME, "port": PORT, "databasePath": str(database_path())})


@app.get("/wallet/me")
def wallet_me():
    # Consulta saldo da carteira demo do usuario autenticado.
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
    # Lista reservas do usuario para a tela "Minhas reservas".
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
    # Fluxo principal: valida quarto/datas/hospede, debita carteira e confirma reserva.
    user_id = authenticated_user_id()
    if not user_id:
        return json_response({"error": "login_required", "message": "Faca login para concluir sua reserva demo."}, 401)
    payload = request.get_json(silent=True) or {}
    with connect() as conn:
        room = find_room(conn, payload.get("roomId")) or ensure_demo_room(conn, payload)
        if not room:
            return json_response({"error": "room_not_found", "message": "Quarto nao encontrado para reserva."}, 404)
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


@app.patch("/bookings/<booking_id>/cancel")
def cancel_booking(booking_id):
    # Cancela reserva do proprio usuario e estorna o valor para a carteira demo.
    user_id = authenticated_user_id()
    if not user_id:
        return json_response({"error": "login_required", "message": "Faca login para cancelar sua reserva."}, 401)

    with connect() as conn:
        booking = conn.execute(
            """
            SELECT id, usuario_id AS user_id, preco_total AS total_price, status
            FROM reservas
            WHERE id = ? AND usuario_id = ?
            """,
            (booking_id, user_id),
        ).fetchone()

        if not booking:
            return json_response({"error": "booking_not_found"}, 404)
        if booking["status"] == "cancelled":
            return json_response({"error": "booking_already_cancelled", "message": "Esta reserva ja foi cancelada."}, 409)

        refund_cents = int(float(booking["total_price"]) * 100)
        transaction_id = str(uuid4())
        conn.execute("UPDATE reservas SET status = 'cancelled', atualizado_em = CURRENT_TIMESTAMP WHERE id = ?", (booking_id,))
        conn.execute("UPDATE carteiras SET saldo_centavos = saldo_centavos + ?, atualizado_em = CURRENT_TIMESTAMP WHERE usuario_id = ?", (refund_cents, user_id))
        conn.execute("INSERT INTO transacoes_carteira (id, usuario_id, reserva_id, tipo, valor_centavos, descricao) VALUES (?, ?, ?, 'credit', ?, ?)", (transaction_id, user_id, booking_id, refund_cents, "Estorno de reserva demo cancelada"))
        wallet_row = wallet(conn, user_id)
        conn.commit()

    return json_response({"data": {"bookingId": booking_id, "status": "cancelled", "refundedCents": refund_cents, "balanceCents": wallet_row["balance_cents"] if wallet_row else None}})


@app.errorhandler(404)
def not_found(_error):
    return json_response({"error": "not_found"}, 404)


if __name__ == "__main__":
    print(f"{SERVICE_NAME} listening on http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, threaded=True, debug=False, use_reloader=False)
