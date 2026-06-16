from pathlib import Path
from dotenv import load_dotenv


# Carrega o .env raiz para todos os servicos Flask locais.
def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_root_env() -> None:
    env_path = project_root() / ".env"
    load_dotenv(env_path, override=False)
