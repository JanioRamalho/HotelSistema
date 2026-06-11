from pathlib import Path
import json
import sys

from flask import Flask, request

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from services.common_py.env import load_root_env
from services.common_py.http import add_cors_headers, json_response
from services.common_py.sqlite_client import connect, database_path, initialize_database, one, rows
from fake_hotel_provider import fetch_fake_hotels


load_root_env()
initialize_database()

app = Flask(__name__)
PORT = int(__import__("os").environ.get("PORT", "4101"))
SERVICE_NAME = __import__("os").environ.get("SERVICE_NAME", "hotel-service")
DATA_DIR = Path(__file__).resolve().parent / "data"
DUMMY_HOTELS = json.loads((DATA_DIR / "dummy-hotels.json").read_text(encoding="utf-8"))
UNIQUE_IMAGES = json.loads((DATA_DIR / "unique-hotel-images.json").read_text(encoding="utf-8"))


@app.after_request
def cors(response):
    return add_cors_headers(response)


def data_source():
    return "sqlite-local+dummy-api"


def to_number(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except ValueError:
        return None


def to_list(value):
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def parse_filters(args):
    return {
        "city": args.get("city") or None,
        "state": args.get("state") or None,
        "guests": to_number(args.get("guests")),
        "priceMin": to_number(args.get("priceMin")),
        "priceMax": to_number(args.get("priceMax")),
        "minRating": to_number(args.get("minRating")),
        "amenities": to_list(args.get("amenities")),
        "stars": [int(item) for item in to_list(args.get("stars")) if item.isdigit()],
    }


def map_hotel_row(row):
    return {
        "id": row["id"],
        "name": row["nome"],
        "slug": row["slug"],
        "description": row["descricao"],
        "shortDescription": row["descricao_curta"],
        "address": row["endereco"],
        "city": row["cidade"],
        "state": row["estado"],
        "country": row["pais"],
        "zipCode": row["cep"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "stars": row["estrelas"],
        "rating": row["nota"],
        "reviewCount": row["quantidade_avaliacoes"],
        "priceFrom": row["preco_inicial"],
        "images": [],
        "amenities": [],
        "rooms": [],
        "reviews": [],
        "policies": {
            "checkIn": row["politica_check_in"],
            "checkOut": row["politica_check_out"],
            "cancellation": row["politica_cancelamento"],
            "pets": row["politica_pets"],
            "children": row["politica_criancas"],
        },
        "contact": {
            "phone": row["contato_telefone"],
            "email": row["contato_email"],
            **({"website": row["contato_site"]} if row["contato_site"] else {}),
        },
    }


def normalize_text(value):
    import unicodedata

    return "".join(
        c for c in unicodedata.normalize("NFD", str(value or "")) if unicodedata.category(c) != "Mn"
    ).lower()


def matches_dummy(hotel, filters):
    if filters["city"] and normalize_text(filters["city"]) not in normalize_text(hotel["city"]):
        return False
    if filters["state"] and hotel["state"] != filters["state"]:
        return False
    if filters["guests"] and not any(room["capacity"] >= filters["guests"] for room in hotel["rooms"]):
        return False
    if filters["priceMin"] and hotel["priceFrom"] < filters["priceMin"]:
        return False
    if filters["priceMax"] and hotel["priceFrom"] > filters["priceMax"]:
        return False
    if filters["minRating"] and hotel["rating"] < filters["minRating"]:
        return False
    if filters["stars"] and hotel["stars"] not in filters["stars"]:
        return False
    if filters["amenities"] and not all(item in hotel["amenities"] for item in filters["amenities"]):
        return False
    return True


def search_dummy(filters):
    return sorted(
        [hotel for hotel in DUMMY_HOTELS if matches_dummy(hotel, filters)],
        key=lambda h: (-h["rating"], -h["reviewCount"], h["name"]),
    )


def hydrate(hotel_rows):
    hotels = [map_hotel_row(row) for row in hotel_rows]
    for hotel in hotels:
        hotel_id = hotel["id"]
        hotel["images"] = [
            {"url": image["url"], "alt": image["texto_alternativo"], "category": image["categoria"]}
            for image in rows("SELECT url, texto_alternativo, categoria FROM imagens_hotel WHERE hotel_id = ? ORDER BY ordem, id", (hotel_id,))
        ]
        hotel["amenities"] = [
            item["comodidade_id"]
            for item in rows("SELECT comodidade_id FROM hoteis_comodidades WHERE hotel_id = ? ORDER BY comodidade_id", (hotel_id,))
        ]
        hotel["reviews"] = [
            {
                "id": review["id"],
                "userId": review["usuario_id"] or "",
                "userName": review["nome_usuario"],
                **({"userAvatar": review["avatar_usuario"]} if review["avatar_usuario"] else {}),
                "rating": review["nota"],
                "comment": review["comentario"],
                "date": review["data_avaliacao"],
                "stayDate": review["data_hospedagem"],
            }
            for review in rows(
                "SELECT id, COALESCE(usuario_id, '') AS usuario_id, nome_usuario, avatar_usuario, nota, comentario, data_avaliacao, data_hospedagem FROM avaliacoes WHERE hotel_id = ? ORDER BY data_avaliacao DESC, id",
                (hotel_id,),
            )
        ]
        hotel["rooms"] = []
        for room in rows("SELECT id, nome, descricao, categoria, preco, capacidade, tamanho, disponivel FROM quartos WHERE hotel_id = ? ORDER BY preco, id", (hotel_id,)):
            hotel["rooms"].append({
                "id": room["id"],
                "name": room["nome"],
                "description": room["descricao"],
                "category": room["categoria"],
                "price": room["preco"],
                "capacity": room["capacidade"],
                "size": room["tamanho"],
                "amenities": [item["comodidade_id"] for item in rows("SELECT comodidade_id FROM quartos_comodidades WHERE quarto_id = ? ORDER BY comodidade_id", (room["id"],))],
                "images": [item["url"] for item in rows("SELECT url FROM imagens_quarto WHERE quarto_id = ? ORDER BY ordem, id", (room["id"],))],
                "available": bool(room["disponivel"]),
            })
    return hotels


def known_slugs():
    database = [row["slug"] for row in rows("SELECT slug FROM hoteis ORDER BY nota DESC, quantidade_avaliacoes DESC, nome ASC")]
    seen = set(database)
    return database + [hotel["slug"] for hotel in search_dummy({"amenities": [], "stars": [], "city": None, "state": None, "guests": None, "priceMin": None, "priceMax": None, "minRating": None}) if hotel["slug"] not in seen]


def assign_unique_images(hotels):
    slugs = known_slugs()
    result = []
    for hotel in hotels:
        fallback = hotel.get("images") or []
        index = slugs.index(hotel["slug"]) % len(UNIQUE_IMAGES) if hotel["slug"] in slugs else 0
        candidate = UNIQUE_IMAGES[index] if UNIQUE_IMAGES else (fallback[0] if fallback else None)
        if candidate:
            hotel = {**hotel, "images": [{"url": candidate["url"], "alt": candidate.get("alt") or hotel["name"], "category": candidate.get("category") or "exterior"}] + fallback[1:]}
        result.append(hotel)
    return result


def search_hotels(filters):
    conditions = []
    params = []
    if filters["city"]:
        conditions.append("LOWER(h.cidade) LIKE LOWER(?)")
        params.append(f"%{filters['city']}%")
    if filters["state"]:
        conditions.append("h.estado = ?")
        params.append(filters["state"])
    if filters["guests"]:
        conditions.append("EXISTS (SELECT 1 FROM quartos q WHERE q.hotel_id = h.id AND q.capacidade >= ?)")
        params.append(filters["guests"])
    if filters["priceMin"]:
        conditions.append("h.preco_inicial >= ?")
        params.append(filters["priceMin"])
    if filters["priceMax"]:
        conditions.append("h.preco_inicial <= ?")
        params.append(filters["priceMax"])
    if filters["minRating"]:
        conditions.append("h.nota >= ?")
        params.append(filters["minRating"])
    if filters["stars"]:
        conditions.append(f"h.estrelas IN ({','.join(['?'] * len(filters['stars']))})")
        params.extend(filters["stars"])
    for amenity in filters["amenities"]:
        conditions.append("EXISTS (SELECT 1 FROM hoteis_comodidades hc WHERE hc.hotel_id = h.id AND hc.comodidade_id = ?)")
        params.append(amenity)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    database_hotels = hydrate(rows(f"SELECT h.* FROM hoteis h {where} ORDER BY h.nota DESC, h.quantidade_avaliacoes DESC, h.nome ASC", params))
    seen = {hotel["slug"] for hotel in database_hotels}
    merged = database_hotels + [hotel for hotel in search_dummy(filters) if hotel["slug"] not in seen]
    return assign_unique_images(merged)


def get_hotel_by_slug(slug):
    row = one("SELECT * FROM hoteis WHERE slug = ? LIMIT 1", (slug,))
    hotel = (hydrate([row])[0] if row else next((item for item in DUMMY_HOTELS if item["slug"] == slug), None))
    return assign_unique_images([hotel])[0] if hotel else None


@app.get("/health")
def health():
    return json_response({"status": "ok", "service": SERVICE_NAME, "port": PORT, "dataSource": data_source(), "databasePath": str(database_path())})


@app.post("/hotels/generate")
def generate_hotels():
    body = request.get_json(silent=True) or {}
    generated = fetch_fake_hotels(count=body.get("count", 5), city=body.get("city"), state=body.get("state"))
    with connect() as conn:
        for hotel in generated:
            conn.execute(
                "INSERT OR REPLACE INTO hoteis (id, nome, slug, descricao, descricao_curta, endereco, cidade, estado, pais, cep, latitude, longitude, estrelas, nota, quantidade_avaliacoes, preco_inicial, politica_check_in, politica_check_out, politica_cancelamento, politica_pets, politica_criancas, contato_telefone, contato_email, contato_site) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (hotel["id"], hotel["name"], hotel["slug"], hotel["description"], hotel["shortDescription"], hotel["address"], hotel["city"], hotel["state"], hotel["country"], hotel["zipCode"], hotel["latitude"], hotel["longitude"], hotel["stars"], hotel["rating"], hotel["reviewCount"], hotel["priceFrom"], hotel["policies"]["checkIn"], hotel["policies"]["checkOut"], hotel["policies"]["cancellation"], hotel["policies"]["pets"], hotel["policies"]["children"], hotel["contact"]["phone"], hotel["contact"]["email"], hotel["contact"].get("website")),
            )
        conn.commit()
    data = [get_hotel_by_slug(hotel["slug"]) for hotel in generated]
    return json_response({"data": data, "meta": {"total": len(data), "source": SERVICE_NAME, "dataSource": data_source()}}, 201)


@app.get("/hotels")
@app.get("/hotels/unique-images")
def hotels():
    data = search_hotels(parse_filters(request.args))
    meta = {"total": len(data), "source": SERVICE_NAME, "dataSource": data_source()}
    if request.path.endswith("unique-images"):
        meta["imageStrategy"] = "global-unique-pool"
    return json_response({"data": data, "meta": meta})


@app.get("/hotels/<path:slug>")
def hotel_detail(slug):
    hotel = get_hotel_by_slug(slug)
    if not hotel:
        return json_response({"error": "hotel_not_found"}, 404)
    return json_response({"data": hotel, "meta": {"source": SERVICE_NAME, "dataSource": data_source()}})


@app.get("/cities")
def cities():
    data = [{"city": row["cidade"], "state": row["estado"]} for row in rows("SELECT DISTINCT cidade, estado FROM hoteis ORDER BY cidade, estado")]
    keys = {f"{item['city']}-{item['state']}" for item in data}
    for hotel in DUMMY_HOTELS:
        key = f"{hotel['city']}-{hotel['state']}"
        if key not in keys:
            data.append({"city": hotel["city"], "state": hotel["state"]})
            keys.add(key)
    data.sort(key=lambda item: (item["city"], item["state"]))
    return json_response({"data": data, "meta": {"source": SERVICE_NAME, "dataSource": data_source()}})


@app.get("/states")
def states():
    data = sorted(set([row["estado"] for row in rows("SELECT DISTINCT estado FROM hoteis ORDER BY estado")] + [hotel["state"] for hotel in DUMMY_HOTELS]))
    return json_response({"data": data, "meta": {"source": SERVICE_NAME, "dataSource": data_source()}})


@app.errorhandler(404)
def not_found(_error):
    return json_response({"error": "not_found"}, 404)


if __name__ == "__main__":
    print(f"{SERVICE_NAME} listening on http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, threaded=True)
