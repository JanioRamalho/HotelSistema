PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verificado_em TEXT,
  avatar_url TEXT,
  senha_hash TEXT,
  telefone TEXT,
  documento TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verificacoes_email (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  email TEXT NOT NULL,
  codigo_hash TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  consumido_em TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cadastros_pendentes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  telefone TEXT,
  documento TEXT,
  codigo_hash TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  tentativas INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hoteis (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  descricao_curta TEXT NOT NULL,
  endereco TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  pais TEXT NOT NULL DEFAULT 'Brasil',
  cep TEXT NOT NULL,
  latitude REAL NOT NULL DEFAULT 0,
  longitude REAL NOT NULL DEFAULT 0,
  estrelas INTEGER NOT NULL CHECK (estrelas BETWEEN 1 AND 5),
  nota REAL NOT NULL DEFAULT 0,
  quantidade_avaliacoes INTEGER NOT NULL DEFAULT 0,
  preco_inicial INTEGER NOT NULL DEFAULT 0,
  politica_check_in TEXT NOT NULL DEFAULT '14:00',
  politica_check_out TEXT NOT NULL DEFAULT '12:00',
  politica_cancelamento TEXT NOT NULL DEFAULT '',
  politica_pets TEXT NOT NULL DEFAULT '',
  politica_criancas TEXT NOT NULL DEFAULT '',
  contato_telefone TEXT NOT NULL DEFAULT '',
  contato_email TEXT NOT NULL DEFAULT '',
  contato_site TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS imagens_hotel (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  url TEXT NOT NULL,
  s3_key TEXT,
  texto_alternativo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('exterior', 'room', 'amenity', 'restaurant', 'pool', 'common')),
  ordem INTEGER NOT NULL DEFAULT 0,
  largura INTEGER,
  altura INTEGER,
  tamanho_bytes INTEGER,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comodidades (
  id TEXT PRIMARY KEY,
  rotulo TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hoteis_comodidades (
  hotel_id TEXT NOT NULL,
  comodidade_id TEXT NOT NULL,
  PRIMARY KEY (hotel_id, comodidade_id),
  FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE CASCADE,
  FOREIGN KEY (comodidade_id) REFERENCES comodidades(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS quartos (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('economic', 'standard', 'luxury')),
  preco INTEGER NOT NULL DEFAULT 0,
  capacidade INTEGER NOT NULL DEFAULT 1,
  tamanho INTEGER NOT NULL DEFAULT 0,
  disponivel INTEGER NOT NULL DEFAULT 1 CHECK (disponivel IN (0, 1)),
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS imagens_quarto (
  id TEXT PRIMARY KEY,
  quarto_id TEXT NOT NULL,
  url TEXT NOT NULL,
  s3_key TEXT,
  texto_alternativo TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  largura INTEGER,
  altura INTEGER,
  tamanho_bytes INTEGER,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quarto_id) REFERENCES quartos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quartos_comodidades (
  quarto_id TEXT NOT NULL,
  comodidade_id TEXT NOT NULL,
  PRIMARY KEY (quarto_id, comodidade_id),
  FOREIGN KEY (quarto_id) REFERENCES quartos(id) ON DELETE CASCADE,
  FOREIGN KEY (comodidade_id) REFERENCES comodidades(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  usuario_id TEXT,
  nome_usuario TEXT NOT NULL,
  avatar_usuario TEXT,
  nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT NOT NULL,
  data_avaliacao TEXT NOT NULL,
  data_hospedagem TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reservas (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  quarto_id TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  hospedes INTEGER NOT NULL,
  preco_total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  nome_hospede TEXT NOT NULL,
  email_hospede TEXT NOT NULL,
  telefone_hospede TEXT NOT NULL,
  documento_hospede TEXT NOT NULL,
  pedidos_especiais TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE RESTRICT,
  FOREIGN KEY (quarto_id) REFERENCES quartos(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS carteiras (
  usuario_id TEXT PRIMARY KEY,
  saldo_centavos INTEGER NOT NULL DEFAULT 2000000,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transacoes_carteira (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  reserva_id TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('credit', 'debit')),
  valor_centavos INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, hotel_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hoteis_cidade_estado ON hoteis(cidade, estado);
CREATE INDEX IF NOT EXISTS idx_hoteis_preco_inicial ON hoteis(preco_inicial);
CREATE INDEX IF NOT EXISTS idx_hoteis_nota ON hoteis(nota);
CREATE INDEX IF NOT EXISTS idx_hoteis_estrelas ON hoteis(estrelas);
CREATE INDEX IF NOT EXISTS idx_hoteis_localizacao ON hoteis(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_imagens_hotel_hotel ON imagens_hotel(hotel_id, ordem);
CREATE INDEX IF NOT EXISTS idx_quartos_hotel ON quartos(hotel_id);
CREATE INDEX IF NOT EXISTS idx_quartos_capacidade ON quartos(capacidade);
CREATE INDEX IF NOT EXISTS idx_imagens_quarto_quarto ON imagens_quarto(quarto_id, ordem);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_hotel ON avaliacoes(hotel_id);
CREATE INDEX IF NOT EXISTS idx_verificacoes_email_usuario ON verificacoes_email(usuario_id, expira_em);
CREATE INDEX IF NOT EXISTS idx_cadastros_pendentes_email ON cadastros_pendentes(email, expira_em);
CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuario_id, criado_em);
CREATE INDEX IF NOT EXISTS idx_reservas_quarto_datas ON reservas(quarto_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_transacoes_carteira_usuario ON transacoes_carteira(usuario_id, criado_em);
