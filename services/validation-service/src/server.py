import logging

from app import PORTA, NOME_SERVICO, app


# Runner do validation-service. A logica fica em app.py para facilitar testes/imports.
if __name__ == "__main__":
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    print(f"{NOME_SERVICO} listening on http://localhost:{PORTA}")
    app.run(host="0.0.0.0", port=PORTA, threaded=True, debug=False, use_reloader=False)
