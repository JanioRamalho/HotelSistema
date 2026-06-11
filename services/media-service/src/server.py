from pathlib import Path
from uuid import uuid4
import logging
import os
import sys

from flask import Flask, request

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from services.common_py.env import load_root_env
from services.common_py.http import add_cors_headers, json_response


# Media Service: simula um servico externo de armazenamento de arquivos.
# Na demo, grava uploads em disco local como se fosse uma camada S3 simplificada.
load_root_env()

logging.getLogger("werkzeug").setLevel(logging.ERROR)

app = Flask(__name__)
PORT = int(os.environ.get("PORT", "4203"))
SERVICE_NAME = os.environ.get("SERVICE_NAME", "media-service")
UPLOAD_DIR = Path(os.environ.get("MEDIA_UPLOAD_DIR", "uploads")).resolve()


@app.after_request
def cors(response):
    return add_cors_headers(response)


@app.get("/health")
def health():
    return json_response({"status": "ok", "service": SERVICE_NAME, "port": PORT, "uploadDir": str(UPLOAD_DIR), "storageMode": "local-s3-simulation"})


@app.post("/upload")
def upload():
    # Recebe bytes crus e devolve uma URL local simulada para o arquivo salvo.
    original_name = request.headers.get("x-file-name") or "upload.bin"
    extension = Path(original_name).suffix or ".bin"
    file_name = f"{uuid4()}{extension}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / file_name).write_bytes(request.get_data())
    return json_response({"data": {"fileName": file_name, "url": f"/uploads/{file_name}", "storageMode": "local-s3-simulation"}}, 201)


@app.errorhandler(404)
def not_found(_error):
    return json_response({"error": "not_found"}, 404)


if __name__ == "__main__":
    print(f"{SERVICE_NAME} listening on http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, threaded=True, debug=False, use_reloader=False)
