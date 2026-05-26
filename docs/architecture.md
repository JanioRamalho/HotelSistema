# Arquitetura do Viajei

## Visao geral

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

- `app/` e `components/`: frontend Next.js. A interface visual permanece desacoplada da arquitetura interna.
- `services/api-gateway`: entrada unica da API. Aplica rate limiting, registra logs, expoe metricas e distribui carga.
- `services/hotel-service`: busca e detalhe de hoteis. Pode rodar em cluster local nas portas `4101` e `4102`.
- `services/auth-service`: cadastro com e-mail/senha, login com e-mail/senha e codigo enviado ao e-mail da conta.
- `services/booking-service`: carteira demo e reservas com desconto de saldo.
- `services/media-service`: upload local simulando S3.
- `services/geolocation-service`: consulta coordenadas do hotel para uso em mapa.
- `services/validation-service`: microsservico Python para validar CPF, CEP, data de nascimento, telefone e dados do hospede antes da reserva.
- `infra/database`: schema e seed do SQLite.

## Fluxos principais

1. O frontend acessa apenas o gateway.
2. O gateway roteia a requisicao para o servico correto.
3. O hotel-service usa SQLite local e o gerador de demonstracao para popular o banco.
4. O validation-service valida dados antes da reserva.
5. O booking-service controla carteira e reserva demo.

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

As tabelas guardam hoteis, quartos, imagens, comodidades, usuarios, verificacoes de email, reservas, favoritos, carteiras e transacoes.

## Endpoints principais

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

## Monitoramento

O gateway expõe `GET /metrics`, com total de requisicoes, bloqueios por rate limit, rotas mais acessadas, upstreams usados, erros e tempo medio.

Os logs sao estruturados em JSON e mostram metodo, rota, status, duracao e upstream.

## Evolucao futura

Hadoop ou Spark nao entram no fluxo principal da aplicacao. Eles ficam como camada futura de analytics para logs de busca e reservas.
