from datetime import date
from random import choice, randint, sample
from uuid import uuid4
import re
import unicodedata


CITY_CATALOG = [
    {"city": "Rio de Janeiro", "state": "RJ", "lat": -22.9068, "lng": -43.1729, "zip": "22000-000"},
    {"city": "Sao Paulo", "state": "SP", "lat": -23.5505, "lng": -46.6333, "zip": "01000-000"},
    {"city": "Salvador", "state": "BA", "lat": -12.9777, "lng": -38.5016, "zip": "40000-000"},
    {"city": "Florianopolis", "state": "SC", "lat": -27.5949, "lng": -48.5482, "zip": "88000-000"},
    {"city": "Recife", "state": "PE", "lat": -8.0476, "lng": -34.877, "zip": "50000-000"},
    {"city": "Fortaleza", "state": "CE", "lat": -3.7319, "lng": -38.5267, "zip": "60000-000"},
    {"city": "Gramado", "state": "RS", "lat": -29.3737, "lng": -50.8764, "zip": "95670-000"},
    {"city": "Buzios", "state": "RJ", "lat": -22.7528, "lng": -41.8846, "zip": "28950-000"},
    {"city": "Curitiba", "state": "PR", "lat": -25.4284, "lng": -49.2733, "zip": "80000-000"},
    {"city": "Belo Horizonte", "state": "MG", "lat": -19.9167, "lng": -43.9345, "zip": "30000-000"},
]

PREFIXES = ["Grand", "Solar", "Villa", "Mirante", "Jardim", "Reserva", "Blue", "Imperial", "Lumiere", "Serra"]
SUFFIXES = ["Palace", "Hotel", "Resort", "Suites", "Inn", "Boutique", "Residence", "Lodge"]
AMENITIES = [
    "wifi",
    "pool",
    "gym",
    "spa",
    "restaurant",
    "bar",
    "room-service",
    "parking",
    "air-conditioning",
    "breakfast",
    "beach-access",
    "kids-club",
    "pet-friendly",
    "concierge",
]
HOTEL_IMAGES = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
]
ROOM_IMAGES = [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
    "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800",
]


def slugify(value):
    normalized = unicodedata.normalize("NFD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", normalized.lower()))


def choose_location(city=None, state=None):
    matches = [
        item for item in CITY_CATALOG
        if (not city or item["city"].lower() == str(city).lower()) and (not state or item["state"] == state)
    ]
    return choice(matches or CITY_CATALOG)


def build_rooms(hotel_id, base_price, stars):
    return [
        {
            "id": f"{hotel_id}-std",
            "name": "Quarto Standard",
            "description": "Quarto confortavel com cama casal, ar-condicionado e banheiro privativo.",
            "category": "standard",
            "price": base_price,
            "capacity": 2,
            "size": 28,
            "amenities": ["wifi", "air-conditioning", "room-service"],
            "images": [ROOM_IMAGES[0]],
        },
        {
            "id": f"{hotel_id}-lux",
            "name": "Suite Master" if stars >= 5 else "Quarto Superior",
            "description": "Acomodacao ampla com area de estar, enxoval premium e vista privilegiada.",
            "category": "luxury" if stars >= 5 else "standard",
            "price": round(base_price * 1.45),
            "capacity": 4 if stars >= 5 else 3,
            "size": 48 if stars >= 5 else 34,
            "amenities": ["wifi", "air-conditioning", "room-service", "breakfast"],
            "images": [ROOM_IMAGES[1]],
        },
    ]


def fetch_fake_hotels(count=5, city=None, state=None):
    count = max(1, min(int(count or 5), 50))
    hotels = []
    for _ in range(count):
        hotel_id = f"auto-{uuid4()}"
        location = choose_location(city, state)
        stars = randint(3, 5)
        base_price = randint(260, 900)
        name = f"{choice(PREFIXES)} {location['city']} {choice(SUFFIXES)}"
        slug = f"{slugify(name)}-{hotel_id[-8:]}"
        hotels.append({
            "id": hotel_id,
            "name": name,
            "slug": slug,
            "description": f"Hotel {stars} estrelas em {location['city']} com estrutura completa para lazer e trabalho.",
            "shortDescription": "Hospedagem demo gerada para ampliar o catalogo.",
            "address": f"Av. Central, {randint(100, 999)}",
            "city": location["city"],
            "state": location["state"],
            "country": "Brasil",
            "zipCode": location["zip"],
            "latitude": location["lat"],
            "longitude": location["lng"],
            "stars": stars,
            "rating": round(randint(40, 50) / 10, 1),
            "reviewCount": randint(80, 1400),
            "priceFrom": base_price,
            "images": [{"id": f"{hotel_id}-img-1", "url": choice(HOTEL_IMAGES), "alt": name, "category": "exterior", "order": 1}],
            "amenities": sample(AMENITIES, randint(6, 10)),
            "rooms": build_rooms(hotel_id, base_price, stars),
            "reviews": [{
                "id": f"{hotel_id}-review-1",
                "userName": "Hospede Viajei",
                "rating": 5,
                "comment": "Experiencia muito confortavel e equipe atenciosa.",
                "date": date.today().isoformat(),
                "stayDate": date.today().isoformat(),
            }],
            "policies": {
                "checkIn": "14:00",
                "checkOut": "12:00",
                "cancellation": "Cancelamento gratuito ate 48h antes da chegada.",
                "pets": "Consulte disponibilidade para pets.",
                "children": "Criancas sao bem-vindas.",
            },
            "contact": {
                "phone": "+55 11 4002-8922",
                "email": "reservas@viajei.example",
                "website": "https://viajei.example",
            },
        })
    return hotels

