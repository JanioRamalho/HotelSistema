from datetime import date, datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import re


PORTA = int(os.environ.get("PORT", "4205"))
NOME_SERVICO = os.environ.get("SERVICE_NAME", "validation-service")


def somente_digitos(valor):
    return re.sub(r"\D", "", str(valor or ""))


def validar_cpf(cpf):
    digitos = somente_digitos(cpf)
    if len(digitos) != 11 or len(set(digitos)) == 1:
        return False

    numeros = [int(caractere) for caractere in digitos]
    soma_primeiro_digito = sum(numeros[indice] * (10 - indice) for indice in range(9))
    primeiro_digito = (soma_primeiro_digito * 10) % 11
    if primeiro_digito == 10:
        primeiro_digito = 0

    soma_segundo_digito = sum(numeros[indice] * (11 - indice) for indice in range(10))
    segundo_digito = (soma_segundo_digito * 10) % 11
    if segundo_digito == 10:
        segundo_digito = 0

    return numeros[9] == primeiro_digito and numeros[10] == segundo_digito


def validar_cep(cep):
    return len(somente_digitos(cep)) == 8


def ler_data_nascimento(valor):
    try:
        return datetime.strptime(str(valor or ""), "%Y-%m-%d").date()
    except ValueError:
        return None


def calcular_idade(data_nascimento):
    hoje = date.today()
    ainda_nao_fez_aniversario = (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day)
    return hoje.year - data_nascimento.year - ainda_nao_fez_aniversario


def validar_data_nascimento(valor, idade_minima=18):
    data_nascimento = ler_data_nascimento(valor)
    if not data_nascimento:
        return False, None

    idade = calcular_idade(data_nascimento)
    if data_nascimento >= date.today():
        return False, idade

    return idade >= idade_minima, idade


def validar_telefone(telefone):
    digitos = somente_digitos(telefone)
    return len(digitos) in (10, 11)


def validar_email(email):
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", str(email or "")))


def validar_hospede_reserva(dados):
    erros = []
    idade_minima = int(dados.get("minimumAge") or 18)
    cpf = dados.get("cpf") or dados.get("document")
    cep = dados.get("cep") or dados.get("zipCode")
    data_nascimento = dados.get("birthdate")
    telefone = dados.get("phone")
    email = dados.get("email")
    nome = str(dados.get("name") or "").strip()

    if len(nome.split()) < 2:
        erros.append({"field": "name", "message": "Informe nome e sobrenome."})

    if not validar_email(email):
        erros.append({"field": "email", "message": "Informe um e-mail valido."})

    if not validar_telefone(telefone):
        erros.append({"field": "phone", "message": "Informe um telefone com DDD."})

    if not validar_cpf(cpf):
        erros.append({"field": "cpf", "message": "CPF invalido."})

    if cep and not validar_cep(cep):
        erros.append({"field": "cep", "message": "CEP deve ter 8 digitos."})

    data_nascimento_valida, idade = validar_data_nascimento(data_nascimento, idade_minima)
    if not data_nascimento_valida:
        erros.append({"field": "birthdate", "message": f"Hospede precisa ter pelo menos {idade_minima} anos."})

    return {
        "valid": len(erros) == 0,
        "errors": erros,
        "normalized": {
            "name": nome,
            "email": email,
            "phone": somente_digitos(telefone),
            "cpf": somente_digitos(cpf),
            "cep": somente_digitos(cep),
            "birthdate": data_nascimento,
            "age": idade,
        },
    }


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("access-control-allow-origin", "*")
        self.send_header("access-control-allow-methods", "GET,POST,OPTIONS")
        self.send_header("access-control-allow-headers", "content-type,authorization,x-user-id")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get("content-length") or 0)
        if length == 0:
            return {}

        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw or "{}")

    def do_OPTIONS(self):
        self._send_json(204, {})

    def do_GET(self):
        if self.path == "/health":
            self._send_json(200, {"status": "ok", "service": NOME_SERVICO, "port": PORTA, "runtime": "python"})
            return

        self._send_json(404, {"error": "not_found"})

    def do_POST(self):
        try:
            payload = self._read_json()

            if self.path == "/validate/cpf":
                cpf = payload.get("cpf") or payload.get("document")
                self._send_json(200, {"valid": validar_cpf(cpf), "normalized": {"cpf": somente_digitos(cpf)}})
                return

            if self.path == "/validate/cep":
                cep = payload.get("cep") or payload.get("zipCode")
                self._send_json(200, {"valid": validar_cep(cep), "normalized": {"cep": somente_digitos(cep)}})
                return

            if self.path == "/validate/birthdate":
                idade_minima = int(payload.get("minimumAge") or 18)
                valido, idade = validar_data_nascimento(payload.get("birthdate"), idade_minima)
                self._send_json(200, {"valid": valido, "age": idade, "minimumAge": idade_minima})
                return

            if self.path == "/validate/reservation-guest":
                resultado = validar_hospede_reserva(payload)
                self._send_json(200 if resultado["valid"] else 422, resultado)
                return

            self._send_json(404, {"error": "not_found"})
        except Exception as error:
            self._send_json(500, {"error": "validation_service_error", "message": str(error)})

    def log_message(self, format, *args):
        print(json.dumps({
            "service": NOME_SERVICO,
            "client": self.client_address[0],
            "message": format % args,
        }))


if __name__ == "__main__":
    servidor = ThreadingHTTPServer(("", PORTA), Handler)
    print(f"{NOME_SERVICO} listening on http://localhost:{PORTA}")
    servidor.serve_forever()
