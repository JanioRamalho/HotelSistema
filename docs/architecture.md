# Arquitetura Final Do Viajei

O Viajei usa uma arquitetura modular para demonstrar conceitos de sistemas distribuidos sem deixar o projeto pesado para apresentacao academica.

## Visao Geral

```txt
Browser
  |
  v
Frontend Next.js
  |
  v
API Gateway
  |-- rate limiting
  |-- load balancing round-robin
  |-- logs estruturados
  |-- metricas de carga
  |
  +-- Hotel Service Cluster
  |     |-- hotel-service-1 :4101
  |     |-- hotel-service-2 :4102
  |     v
  |   SQLite local
  |
  +-- Auth Service :4201
  |     |-- login com e-mail e senha
  |     |-- codigo enviado por e-mail
  |     |-- cria a carteira bonus apos validar o codigo
  |     v
  |   SQLite local
  |
  +-- Booking/Wallet Service :4202
  |     |-- saldo demo de R$ 20.000 por usuario logado
  |     |-- reserva demo
  |     |-- transacoes de carteira
  |     v
  |   SQLite local
  |
  +-- Media Service :4203
  |     |-- upload local
  |     |-- simulacao de S3
  |
  +-- Geolocation Service :4204
  |     |-- coordenadas dos hoteis
  |     |-- base para mapa
  |     v
  |   SQLite local
  |
  +-- Validation Service Python :4205
        |-- CPF
        |-- CEP
        |-- data de nascimento
        |-- dados do hospede
```

## Componentes

- `app/` e `components/`: frontend Next.js. A interface visual deve permanecer desacoplada da arquitetura interna.
- `services/api-gateway`: entrada unica da API. Aplica rate limiting, registra logs, expoe metricas e distribui carga.
- `services/hotel-service`: busca e detalhe de hoteis. Pode rodar em cluster local nas portas `4101` e `4102`. Tambem possui uma Dummy API interna com hoteis ficticios para popular cidades e estados sem depender de API externa.
- `services/auth-service`: cadastro com e-mail/senha, login com e-mail/senha e codigo enviado ao e-mail da conta.
- `services/booking-service`: carteira demo e reservas com desconto de saldo.
- `services/media-service`: upload local simulando S3.
- `services/geolocation-service`: consulta coordenadas do hotel para uso em mapa.
- `services/validation-service`: microsservico Python para validar CPF, CEP, data de nascimento, telefone e dados do hospede antes da reserva.
- `infra/database`: schema e seed do SQLite.

## Banco

O banco principal da versao academica e SQLite local:

```txt
hoteis.db
```

O schema versionado fica em:

```txt
infra/database/schema.sql
infra/database/seed-hotels.sql
```

O banco guarda hoteis, quartos, imagens, comodidades, usuarios, verificacoes de email, reservas, favoritos, carteiras e transacoes.
As tabelas e colunas do SQLite foram nomeadas em portugues para deixar o modelo mais claro na apresentacao academica, enquanto as APIs mantem o contrato consumido pelo frontend.
O saldo bonus de R$ 20.000 fica registrado na conta do usuario depois do login, na tabela `carteiras`.
No login com senha, a carteira so e liberada apos credenciais validas e validacao do codigo recebido por e-mail.

## Endpoints Principais

Gateway:

- `GET /health`
- `GET /metrics`
- `GET /api/hotels`
- `GET /api/hotels/:slug`
- `GET /api/geolocation/hotel/:slug`
- `GET /api/wallet/me`
- `GET /api/bookings/me`
- `POST /api/bookings`
- `POST /api/auth/password/register`
- `POST /api/auth/password/register/confirm`
- `POST /api/auth/password/login`
- `POST /api/media/upload`
- `GET /api/validation/health`
- `POST /api/validation/validate/reservation-guest`

## Execucao Local

Em terminais separados:

```bash
npm run dev:hotel-service:1
npm run dev:hotel-service:2
npm run dev:auth-service
npm run dev:booking-service
npm run dev:media-service
npm run dev:geolocation-service
npm run dev:validation-service
npm run dev:gateway
npm run dev
```

Para demonstrar load balancing, configure o gateway com:

```env
HOTEL_SERVICE_URLS=http://localhost:4101,http://localhost:4102
```

## Monitoramento

O gateway expoe:

```txt
GET http://localhost:4100/metrics
```

As metricas incluem total de requisicoes, requisicoes bloqueadas por rate limit, rotas mais acessadas, upstreams usados, erros e tempo medio.

Os logs sao estruturados em JSON no terminal, com metodo, rota, status, duracao e upstream escolhido.

## Evolucao Para Hadoop

Hadoop ou Spark nao entram no fluxo principal da aplicacao. Eles ficam como camada futura de analytics:

```txt
Logs de busca e reservas
  |
  v
Arquivos JSON/CSV
  |
  v
Hadoop/Spark
  |
  v
Relatorios, rankings e recomendacoes
```

Essa separacao deixa o sistema atual simples para rodar e ainda abre caminho para Big Data no futuro.
