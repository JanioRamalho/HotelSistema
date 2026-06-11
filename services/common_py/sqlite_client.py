from pathlib import Path
import os
import sqlite3
import time

from .env import project_root


# Helper compartilhado de banco local.
# Inicializa schema/seed e entrega conexoes SQLite padronizadas para os servicos.
TRANSLATED_TABLES = [
    "transacoes_carteira",
    "favoritos",
    "carteiras",
    "reservas",
    "avaliacoes",
    "quartos_comodidades",
    "imagens_quarto",
    "quartos",
    "hoteis_comodidades",
    "comodidades",
    "imagens_hotel",
    "verificacoes_email",
    "cadastros_pendentes",
    "usuarios",
    "hoteis",
]

TRANSLATED_INDEXES = [
    "idx_hoteis_cidade_estado",
    "idx_hoteis_preco_inicial",
    "idx_hoteis_nota",
    "idx_hoteis_estrelas",
    "idx_hoteis_localizacao",
    "idx_imagens_hotel_hotel",
    "idx_quartos_hotel",
    "idx_quartos_capacidade",
    "idx_imagens_quarto_quarto",
    "idx_avaliacoes_hotel",
    "idx_verificacoes_email_usuario",
    "idx_reservas_usuario",
    "idx_reservas_quarto_datas",
    "idx_transacoes_carteira_usuario",
]


def database_path() -> Path:
    configured = os.environ.get("SQLITE_DATABASE_PATH", "./hoteis.db")
    path = Path(configured)
    if path.is_absolute():
        return path
    return project_root() / path


def schema_path() -> Path:
    return project_root() / "infra" / "database" / "schema.sql"


def seed_path() -> Path:
    return project_root() / "infra" / "database" / "seed-hotels.sql"


def connect() -> sqlite3.Connection:
    # WAL e busy_timeout ajudam varios servicos locais a acessarem o mesmo SQLite.
    conn = sqlite3.connect(database_path(), timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn


def _table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
    return conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        (table_name,),
    ).fetchone() is not None


def _table_has_column(conn: sqlite3.Connection, table_name: str, column_name: str) -> bool:
    return any(row["name"] == column_name for row in conn.execute(f"PRAGMA table_info({table_name})"))


def _prepare_translated_schema(conn: sqlite3.Connection) -> None:
    # Migra bancos antigos com nomes de colunas legados sem apagar dados do usuario.
    if not _table_exists(conn, "hoteis") or _table_has_column(conn, "hoteis", "estado"):
        return

    suffix = int(time.time() * 1000)
    conn.execute("PRAGMA foreign_keys = OFF;")
    for index_name in TRANSLATED_INDEXES:
        conn.execute(f"DROP INDEX IF EXISTS {index_name};")
    for table_name in TRANSLATED_TABLES:
        if _table_exists(conn, table_name):
            conn.execute(f"ALTER TABLE {table_name} RENAME TO {table_name}_legado_{suffix};")
    conn.execute("PRAGMA foreign_keys = ON;")


def initialize_database() -> None:
    # Garante que todo servico suba com schema e dados iniciais prontos.
    if not schema_path().exists():
        raise FileNotFoundError(f"Schema SQL nao encontrado em {schema_path()}")

    for attempt in range(5):
        try:
            with connect() as conn:
                conn.execute("BEGIN IMMEDIATE;")
                _prepare_translated_schema(conn)
                conn.executescript(schema_path().read_text(encoding="utf-8"))
                if seed_path().exists():
                    conn.executescript(seed_path().read_text(encoding="utf-8"))
                conn.commit()
            return
        except sqlite3.OperationalError as error:
            if "database is locked" not in str(error) or attempt == 4:
                raise
            time.sleep(0.25 * (attempt + 1))


def rows(sql: str, params=()):
    with connect() as conn:
        return [dict(row) for row in conn.execute(sql, tuple(params)).fetchall()]


def one(sql: str, params=()):
    with connect() as conn:
        row = conn.execute(sql, tuple(params)).fetchone()
        return dict(row) if row else None
