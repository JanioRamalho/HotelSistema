from app import PORTA, NOME_SERVICO, app


if __name__ == "__main__":
    print(f"{NOME_SERVICO} listening on http://localhost:{PORTA}")
    app.run(host="0.0.0.0", port=PORTA, threaded=True)
