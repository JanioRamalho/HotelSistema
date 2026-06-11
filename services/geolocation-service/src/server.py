from pathlib import Path
import logging
import os
import sys

from flask import Flask

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from services.common_py.env import load_root_env
from services.common_py.http import add_cors_headers, json_response
from services.common_py.sqlite_client import connect, database_path, initialize_database


# Geolocation Service: isola dados de localizacao dos hoteis.
# O Gateway usa este servico para consultar endereco e coordenadas por slug.
load_root_env()
initialize_database()

logging.getLogger("werkzeug").setLevel(logging.ERROR)

app = Flask(__name__)
PORT = int(os.environ.get("PORT", "4204"))
SERVICE_NAME = os.environ.get("SERVICE_NAME", "geolocation-service")


@app.after_request
def cors(response):
    return add_cors_headers(response)


@app.get("/health")
def health():
    return json_response({"status": "ok", "service": SERVICE_NAME, "port": PORT, "databasePath": str(database_path())})


@app.get("/hotel/<path:slug>")
def hotel(slug):
    # Retorna apenas os campos necessarios para mapas/localizacao.
    with connect() as conn:
        row = conn.execute(
            """
            SELECT id, nome AS name, slug, endereco AS address, cidade AS city,
                   estado AS state, pais AS country, latitude, longitude
            FROM hoteis
            WHERE slug = ?
            """,
            (slug,),
        ).fetchone()
    if not row:
        return json_response({"error": "hotel_not_found"}, 404)
    return json_response({"data": dict(row)})


@app.errorhandler(404)
def not_found(_error):
    return json_response({"error": "not_found"}, 404)


if __name__ == "__main__":
    print(f"{SERVICE_NAME} listening on http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, threaded=True, debug=False, use_reloader=False)
