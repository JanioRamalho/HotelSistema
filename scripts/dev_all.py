import socket
import subprocess
import sys
import time
from shutil import which


COMMANDS = [
    {"name": "hotel-service-1", "command": ["npm", "run", "dev:hotel-service:1"], "port": 4101},
    {"name": "auth-service", "command": ["npm", "run", "dev:auth-service"], "port": 4201},
    {"name": "booking-service", "command": ["npm", "run", "dev:booking-service"], "port": 4202},
    {"name": "geolocation-service", "command": ["npm", "run", "dev:geolocation-service"], "port": 4204},
    {"name": "validation-service", "command": ["npm", "run", "dev:validation-service"], "port": 4205},
    {"name": "api-gateway", "command": ["npm", "run", "dev:gateway"], "port": 4100},
    {"name": "frontend", "command": ["npm", "run", "dev"], "port": 3000},
]

children = []


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
            child.terminate()
    time.sleep(0.5)
    for child in children:
        if child.poll() is None:
            child.kill()
    sys.exit(code)


def start_command(item):
    port = item.get("port")
    if port and is_port_open(port):
        print(f"[dev:all] {item['name']} ja esta rodando na porta {port}; ignorando.")
        return

    command = item["command"].copy()
    resolved = which(command[0])
    if resolved:
        command[0] = resolved

    child = subprocess.Popen(command)
    children.append(child)

    if port and not wait_for_port(port):
        print(f"[dev:all] {item['name']} nao ficou pronto na porta {port}", file=sys.stderr)
        shutdown(1)


def main():
    try:
        for item in COMMANDS:
            start_command(item)

        while True:
            for child in children:
                code = child.poll()
                if code not in (None, 0):
                    print(f"[dev:all] processo encerrado com codigo {code}", file=sys.stderr)
                    shutdown(1)
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown(0)


if __name__ == "__main__":
    main()
