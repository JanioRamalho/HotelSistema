from datetime import date, datetime
import logging
import os
import re

from flask import Flask, request


PORTA = int(os.environ.get("PORT", "4205"))
NOME_SERVICO = os.environ.get("SERVICE_NAME", "validation-service")
logging.getLogger("werkzeug").setLevel(logging.ERROR)
app = Flask(__name__)

# Validation Service: centraliza regras de validacao usadas por cadastro e reserva.
# Ele evita duplicar regras de CPF, telefone, e-mail, CEP e idade em outros servicos.

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
    return len(somente_digitos(telefone)) in (10, 11)


def validar_email(email):
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", str(email or "")))


def validar_hospede_reserva(dados):
    # Valida o conjunto completo exigido para criar uma reserva de hotel.
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

    data_valida, idade = validar_data_nascimento(data_nascimento, idade_minima)
    if not data_valida:
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


@app.after_request
def cors(response):
    response.headers["access-control-allow-origin"] = "*"
    response.headers["access-control-allow-methods"] = "GET,POST,OPTIONS"
    response.headers["access-control-allow-headers"] = "content-type,authorization,x-user-id"
    return response


@app.get("/health")
def health():
    return {"status": "ok", "service": NOME_SERVICO, "port": PORTA, "runtime": "python-flask"}


@app.post("/validate/cpf")
def validate_cpf():
    payload = request.get_json(silent=True) or {}
    cpf = payload.get("cpf") or payload.get("document")
    return {"valid": validar_cpf(cpf), "normalized": {"cpf": somente_digitos(cpf)}}


@app.post("/validate/cep")
def validate_cep():
    payload = request.get_json(silent=True) or {}
    cep = payload.get("cep") or payload.get("zipCode")
    return {"valid": validar_cep(cep), "normalized": {"cep": somente_digitos(cep)}}


@app.post("/validate/birthdate")
def validate_birthdate():
    payload = request.get_json(silent=True) or {}
    idade_minima = int(payload.get("minimumAge") or 18)
    valido, idade = validar_data_nascimento(payload.get("birthdate"), idade_minima)
    return {"valid": valido, "age": idade, "minimumAge": idade_minima}


@app.post("/validate/reservation-guest")
def validate_reservation_guest():
    # Endpoint consumido pelo auth-service e booking-service.
    resultado = validar_hospede_reserva(request.get_json(silent=True) or {})
    return resultado, 200 if resultado["valid"] else 422


@app.errorhandler(404)
def not_found(_error):
    return {"error": "not_found"}, 404


if __name__ == "__main__":
    print(f"{NOME_SERVICO} listening on http://localhost:{PORTA}")
    app.run(host="0.0.0.0", port=PORTA, threaded=True, debug=False, use_reloader=False)
