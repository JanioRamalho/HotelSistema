import os
import json
import socket
import subprocess
import sys
import threading
import time
from shutil import which


COMMANDS = [
    {"name": "hotel-service-1", "python": "services/hotel-service/src/server.py", "port": 4101, "env": {"PORT": "4101", "SERVICE_NAME": "hotel-service-1"}},
    {"name": "hotel-service-2", "python": "services/hotel-service/src/server.py", "port": 4102, "env": {"PORT": "4102", "SERVICE_NAME": "hotel-service-2"}},
    {"name": "auth-service", "python": "services/auth-service/src/server.py", "port": 4201},
    {"name": "booking-service", "python": "services/booking-service/src/server.py", "port": 4202},
    {"name": "geolocation-service", "python": "services/geolocation-service/src/server.py", "port": 4204},
    {"name": "validation-service", "python": "services/validation-service/src/app.py", "port": 4205},
    {"name": "api-gateway", "python": "services/api-gateway/src/server.py", "port": 4100, "env": {"HOTEL_SERVICE_URLS": "http://localhost:4101,http://localhost:4102"}},
    {"name": "frontend", "command": ["npm", "run", "dev"], "port": 3000},
]

children = []
child_names = {}


def service_url(item):
    port = item.get("port")
    return f"http://localhost:{port}" if port else "-"


def hide_child_line(line):
    stripped = line.strip()
    if not stripped:
        return True
    if stripped.startswith("> "):
        return True
    if stripped.startswith("* Serving Flask app"):
        return True
    if stripped.startswith("* Debug mode:"):
        return True
    if stripped.startswith("* Running on"):
        return True
    if stripped.startswith("* Tip:"):
        return True
    if stripped.startswith("WARNING: This is a development server"):
        return True
    if stripped == "Press CTRL+C to quit":
        return True
    if " listening on http://localhost:" in stripped:
        return True
    if stripped.startswith("127.0.0.1 - -"):
        return True
    if stripped.startswith("- Network:"):
        return True
    if stripped.startswith("- Local:"):
        return True
    if "Ready in" in stripped:
        return True
    return False


def format_child_line(name, line):
    stripped = line.strip()
    if stripped.startswith("{"):
        try:
            event = json.loads(stripped)
        except json.JSONDecodeError:
            return f"[{name}] {stripped}"

        if event.get("event") == "auth_config":
            return f"[auth-service] email={event.get('emailProvider')} smtp={event.get('smtpConfigured')} resend={event.get('resendConfigured')}"
        if event.get("event") == "proxy":
            return f"[api-gateway] {event.get('method')} {event.get('path')} -> {event.get('status')} via {event.get('upstream')} ({event.get('durationMs')}ms)"
        if event.get("event") == "proxy_error":
            return f"[api-gateway] {event.get('method')} {event.get('path')} -> 502 via {event.get('upstream')}: {event.get('error')}"
        if event.get("event") == "rate_limited":
            return f"[api-gateway] rate limit {event.get('method')} {event.get('path')}"
        return f"[{name}] {stripped}"

    if "Next.js" in stripped:
        return f"[frontend] {stripped[stripped.find('Next.js'):]}"

    return f"[{name}] {stripped}"


def stream_child_output(child, name, stream):
    try:
        for line in stream:
            if hide_child_line(line):
                continue
            print(format_child_line(name, line), flush=True)
    finally:
        stream.close()


def attach_log_threads(child, name):
    for stream in (child.stdout, child.stderr):
        if stream is None:
            continue
        thread = threading.Thread(target=stream_child_output, args=(child, name, stream), daemon=True)
        thread.start()


def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.25)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def wait_for_port(port, timeout=15):
    started = time.time()
    while time.time() - started < timeout:
        if is_port_open(port):
            return True
        time.sleep(0.3)
    return False


def shutdown(code=0):
    for child in children:
        if child.poll() is None:
            terminate_tree(child)
    time.sleep(0.5)
    for child in children:
        if child.poll() is None:
            terminate_tree(child, force=True)
    sys.exit(code)


def terminate_tree(child, force=False):
    if sys.platform.startswith("win"):
        args = ["taskkill", "/PID", str(child.pid), "/T"]
        if force:
            args.append("/F")
        subprocess.run(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return

    if force:
        child.kill()
    else:
        child.terminate()


def build_command(item):
    if "python" in item:
        return [sys.executable, "-u", item["python"]]

    command = item["command"].copy()
    resolved = which(command[0])
    if resolved:
        command[0] = resolved
    return command


def start_command(item):
    port = item.get("port")
    if port and is_port_open(port):
        print(f"[skip] {item['name']:<20} already running at {service_url(item)}", flush=True)
        return

    command = build_command(item)
    env = None
    if item.get("env") or "python" in item:
        env = {**os.environ, **item.get("env", {})}
    if env is not None:
        env["PYTHONUNBUFFERED"] = "1"

    print(f"[start] {item['name']:<20} {service_url(item)}", flush=True)
    child = subprocess.Popen(command, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
    children.append(child)
    child_names[child.pid] = item["name"]
    attach_log_threads(child, item["name"])

    if port and not wait_for_port(port):
        print(f"[fail] {item['name']:<20} did not open port {port}", file=sys.stderr, flush=True)
        shutdown(1)

    if port:
        print(f"[ok]    {item['name']:<20} {service_url(item)}", flush=True)


def print_intro():
    print("")
    print("[dev:all] starting Viajei local stack", flush=True)
    print("[dev:all] gateway will balance hotel-service between :4101 and :4102", flush=True)
    print("")


def print_summary():
    print("")
    print("[ready] Viajei stack is running", flush=True)
    print("")
    print("  Frontend           http://localhost:3000")
    print("  API Gateway        http://localhost:4100")
    print("  Services health    http://localhost:4100/health/services")
    print("  Metrics            http://localhost:4100/metrics")
    print("")
    print("  hotel-service-1    http://localhost:4101")
    print("  hotel-service-2    http://localhost:4102")
    print("  auth-service       http://localhost:4201")
    print("  booking-service    http://localhost:4202")
    print("  geolocation        http://localhost:4204")
    print("  validation         http://localhost:4205")
    print("")
    print("[dev:all] press Ctrl+C to stop all services", flush=True)


def main():
    try:
        print_intro()
        for item in COMMANDS:
            start_command(item)

        if not children:
            print("[dev:all] all services were already running; nothing new was started.", flush=True)
            return

        print_summary()

        while True:
            for child in children:
                code = child.poll()
                if code not in (None, 0):
                    name = child_names.get(child.pid, "process")
                    print(f"[fail] {name} exited with code {code}", file=sys.stderr, flush=True)
                    shutdown(1)
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown(0)


if __name__ == "__main__":
    main()
