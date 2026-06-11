from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError
import json
import logging
import os
import sys
import time

from flask import Flask, Response, request

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from services.common_py.env import load_root_env
from services.common_py.http import add_cors_headers, json_response


# API Gateway: ponto unico de entrada do frontend para os microservicos.
# Ele centraliza CORS, rate limit, metricas, health check agregado e proxy HTTP.
load_root_env()

logging.getLogger("werkzeug").setLevel(logging.ERROR)

app = Flask(__name__)
PORT = int(os.environ.get("PORT", "4100"))
CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "*")
RATE_LIMIT_WINDOW_MS = int(os.environ.get("RATE_LIMIT_WINDOW_MS", "60000"))
RATE_LIMIT_MAX = int(os.environ.get("RATE_LIMIT_MAX", "100"))
UPSTREAM_TIMEOUT_MS = int(os.environ.get("UPSTREAM_TIMEOUT_MS", "15000"))


def parse_urls(value):
    return [item.strip().rstrip("/") for item in str(value or "").split(",") if item.strip()]


# Cada entrada pode receber uma ou mais URLs. No hotel-service usamos duas
# instancias para demonstrar balanceamento de carga e tolerancia a falhas.
UPSTREAMS = {
    "hotelService": parse_urls(os.environ.get("HOTEL_SERVICE_URLS", "http://localhost:4101")),
    "authService": parse_urls(os.environ.get("AUTH_SERVICE_URLS", "http://localhost:4201")),
    "bookingService": parse_urls(os.environ.get("BOOKING_SERVICE_URLS", "http://localhost:4202")),
    "mediaService": parse_urls(os.environ.get("MEDIA_SERVICE_URLS", "http://localhost:4203")),
    "geolocationService": parse_urls(os.environ.get("GEOLOCATION_SERVICE_URLS", "http://localhost:4204")),
    "validationService": parse_urls(os.environ.get("VALIDATION_SERVICE_URLS", "http://localhost:4205")),
}

REQUIRED_UPSTREAMS = {
    "hotelService",
    "authService",
    "bookingService",
    "geolocationService",
    "validationService",
}

upstream_indexes = defaultdict(int)
rate_limit_buckets = {}
metrics = {
    "startedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "totalRequests": 0,
    "rateLimitedRequests": 0,
    "requestsByRoute": {},
    "upstreams": {},
}


@app.after_request
def cors(response):
    response.headers["access-control-allow-origin"] = CORS_ORIGIN
    response.headers["access-control-allow-methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    response.headers["access-control-allow-headers"] = "content-type,authorization,x-user-id"
    return response


def log_event(event):
    print(json.dumps({"timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"), "service": "api-gateway", **event}))


def route_key(pathname):
    if pathname.startswith("/api/hotels/"):
        return "/api/hotels/:slug"
    if pathname.startswith("/api/hotels"):
        return "/api/hotels"
    if pathname.startswith("/api/auth"):
        return "/api/auth/*"
    if pathname.startswith("/api/bookings"):
        return "/api/bookings/*"
    if pathname.startswith("/api/media"):
        return "/api/media/*"
    if pathname.startswith("/api/geolocation"):
        return "/api/geolocation/*"
    if pathname.startswith("/api/validation"):
        return "/api/validation/*"
    return pathname


def increment_metric(pathname):
    metrics["totalRequests"] += 1
    key = route_key(pathname)
    metrics["requestsByRoute"][key] = metrics["requestsByRoute"].get(key, 0) + 1


def client_ip():
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def is_rate_limited():
    ip = client_ip()
    now = int(time.time() * 1000)
    bucket = rate_limit_buckets.get(ip)
    if not bucket or now > bucket["resetAt"]:
        rate_limit_buckets[ip] = {"count": 1, "resetAt": now + RATE_LIMIT_WINDOW_MS}
        return False
    bucket["count"] += 1
    return bucket["count"] > RATE_LIMIT_MAX


def get_next_upstream(service_name):
    # Round-robin simples: cada chamada escolhe a proxima instancia disponivel.
    urls = UPSTREAMS.get(service_name) or []
    if not urls:
        return None
    current = upstream_indexes[service_name]
    upstream_indexes[service_name] = current + 1
    return urls[current % len(urls)]


def record_upstream(origin, status, duration_ms):
    item = metrics["upstreams"].setdefault(origin, {"requests": 0, "errors": 0, "totalDurationMs": 0, "lastStatus": None})
    item["requests"] += 1
    item["totalDurationMs"] += duration_ms
    item["lastStatus"] = status
    if status >= 500:
        item["errors"] += 1


def check_upstream_health(service_name, upstream):
    # Consulta /health de cada servico para expor a saude geral da arquitetura.
    started = time.time()
    target = f"{upstream}/health"
    try:
        with urlrequest.urlopen(target, timeout=UPSTREAM_TIMEOUT_MS / 1000) as response:
            body = json.loads(response.read().decode("utf-8") or "{}")
            duration = round((time.time() - started) * 1000)
            return {
                "service": service_name,
                "url": upstream,
                "required": service_name in REQUIRED_UPSTREAMS,
                "status": "up",
                "httpStatus": response.status,
                "durationMs": duration,
                "details": body,
            }
    except HTTPError as error:
        duration = round((time.time() - started) * 1000)
        return {
            "service": service_name,
            "url": upstream,
            "required": service_name in REQUIRED_UPSTREAMS,
            "status": "degraded",
            "httpStatus": error.code,
            "durationMs": duration,
            "error": error.reason,
        }
    except (URLError, TimeoutError, OSError) as error:
        duration = round((time.time() - started) * 1000)
        return {
            "service": service_name,
            "url": upstream,
            "required": service_name in REQUIRED_UPSTREAMS,
            "status": "down",
            "durationMs": duration,
            "error": str(error),
        }


def proxy_json(service_name, path):
    # Encaminha a requisicao original para o microservico correto.
    # Se uma instancia falhar por timeout/conexao, tenta a proxima upstream.
    service_upstreams = UPSTREAMS.get(service_name) or []
    first = get_next_upstream(service_name)
    if not first:
        return json_response({"error": "upstream_not_configured", "service": service_name}, 502)

    queue = [first] + [url for url in service_upstreams if url != first]
    body = None if request.method in ("GET", "HEAD") else request.get_data()
    last_error = None
    started = time.time()

    for upstream in queue:
        target = f"{upstream}{path}"
        if request.query_string:
            target = f"{target}?{request.query_string.decode('utf-8')}"

        headers = {
            "accept": request.headers.get("accept", "application/json"),
            "authorization": request.headers.get("authorization", ""),
            "x-user-id": request.headers.get("x-user-id", ""),
            "content-type": request.headers.get("content-type", "application/json"),
        }
        req = urlrequest.Request(target, data=body, method=request.method, headers=headers)
        origin = upstream

        try:
            with urlrequest.urlopen(req, timeout=UPSTREAM_TIMEOUT_MS / 1000) as response:
                response_body = response.read()
                status = response.status
                content_type = response.headers.get("content-type", "application/json; charset=utf-8")
            duration = round((time.time() - started) * 1000)
            record_upstream(origin, status, duration)
            log_event({"event": "proxy", "method": request.method, "path": path, "status": status, "durationMs": duration, "upstream": origin})
            proxied = Response(response_body, status=status, content_type=content_type)
            proxied.headers["x-upstream-service"] = origin
            return add_cors_headers(proxied)
        except HTTPError as error:
            response_body = error.read()
            status = error.code
            duration = round((time.time() - started) * 1000)
            record_upstream(origin, status, duration)
            log_event({"event": "proxy", "method": request.method, "path": path, "status": status, "durationMs": duration, "upstream": origin})
            proxied = Response(response_body, status=status, content_type=error.headers.get("content-type", "application/json; charset=utf-8"))
            proxied.headers["x-upstream-service"] = origin
            return add_cors_headers(proxied)
        except (URLError, TimeoutError, OSError) as error:
            last_error = error
            duration = round((time.time() - started) * 1000)
            record_upstream(origin, 502, duration)
            log_event({"event": "proxy_error", "method": request.method, "path": path, "status": 502, "durationMs": duration, "upstream": origin, "error": str(error)})

    return json_response({"error": "upstream_unavailable", "message": str(last_error) if last_error else "Todos os upstreams estao indisponiveis."}, 502)


@app.before_request
def before():
    # Middleware do Gateway: contabiliza metricas e aplica limite basico por IP.
    if request.method == "OPTIONS":
        return json_response({}, 204)
    increment_metric(request.path)
    if request.path not in ("/health", "/metrics") and is_rate_limited():
        metrics["rateLimitedRequests"] += 1
        log_event({"event": "rate_limited", "method": request.method, "path": request.path, "ip": client_ip(), "status": 429})
        return json_response({"error": "rate_limit_exceeded", "message": "Muitas requisicoes. Tente novamente em alguns segundos."}, 429)
    return None


@app.get("/health")
def health():
    return json_response({"status": "ok", "service": "api-gateway", "rateLimit": {"windowMs": RATE_LIMIT_WINDOW_MS, "max": RATE_LIMIT_MAX}, "upstreamTimeoutMs": UPSTREAM_TIMEOUT_MS, "upstreams": UPSTREAMS})


@app.get("/health/services")
def services_health():
    # Health check agregado usado para visualizar tolerancia a falhas na demo.
    checks = []
    for service_name, upstreams in UPSTREAMS.items():
        for upstream in upstreams:
            checks.append(check_upstream_health(service_name, upstream))

    required_checks = [item for item in checks if item["required"]]
    up = sum(1 for item in checks if item["status"] == "up")
    down = sum(1 for item in checks if item["status"] == "down")
    degraded = sum(1 for item in checks if item["status"] == "degraded")
    required_down = sum(1 for item in required_checks if item["status"] == "down")
    required_degraded = sum(1 for item in required_checks if item["status"] == "degraded")
    required_up = sum(1 for item in required_checks if item["status"] == "up")
    status = "ok" if required_down == 0 and required_degraded == 0 else ("degraded" if required_up > 0 else "down")
    http_status = 200 if status == "ok" else 207
    return json_response({"status": status, "summary": {"up": up, "down": down, "degraded": degraded, "requiredUp": required_up, "requiredDown": required_down, "requiredDegraded": required_degraded, "total": len(checks)}, "services": checks}, http_status)


@app.get("/metrics")
def gateway_metrics():
    upstream_metrics = {}
    for key, value in metrics["upstreams"].items():
        upstream_metrics[key] = {**value, "averageDurationMs": round(value["totalDurationMs"] / value["requests"]) if value["requests"] else 0}
    return json_response({**metrics, "upstreams": upstream_metrics})


@app.route("/api/hotels", defaults={"subpath": ""}, methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.route("/api/hotels/<path:subpath>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def hotels(subpath):
    return proxy_json("hotelService", f"/hotels{('/' + subpath) if subpath else ''}")


@app.route("/api/cities", methods=["GET"])
@app.route("/api/states", methods=["GET"])
def hotel_facets():
    return proxy_json("hotelService", request.path.replace("/api", ""))


@app.route("/api/auth/<path:subpath>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def auth(subpath):
    return proxy_json("authService", f"/{subpath}")


@app.route("/api/bookings", defaults={"subpath": ""}, methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.route("/api/bookings/<path:subpath>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def bookings(subpath):
    return proxy_json("bookingService", f"/bookings{('/' + subpath) if subpath else ''}")


@app.route("/api/wallet", defaults={"subpath": ""}, methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.route("/api/wallet/<path:subpath>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def wallet(subpath):
    return proxy_json("bookingService", f"/wallet{('/' + subpath) if subpath else ''}")


@app.route("/api/media", defaults={"subpath": ""}, methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.route("/api/media/<path:subpath>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def media(subpath):
    return proxy_json("mediaService", f"/{subpath}" if subpath else "")


@app.route("/api/geolocation", defaults={"subpath": ""}, methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.route("/api/geolocation/<path:subpath>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def geolocation(subpath):
    return proxy_json("geolocationService", f"/{subpath}" if subpath else "")


@app.route("/api/validation", defaults={"subpath": ""}, methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.route("/api/validation/<path:subpath>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def validation(subpath):
    return proxy_json("validationService", f"/{subpath}" if subpath else "")


@app.errorhandler(404)
def not_found(_error):
    return json_response({"error": "route_not_found"}, 404)


if __name__ == "__main__":
    print(f"api-gateway listening on http://localhost:{PORT}")
    print(f"hotel-service upstreams: {', '.join(UPSTREAMS['hotelService'])}")
    app.run(host="0.0.0.0", port=PORT, threaded=True, debug=False, use_reloader=False)
