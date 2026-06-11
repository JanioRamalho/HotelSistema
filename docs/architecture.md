# Arquitetura do Viajei

## Visao geral

```txt
Browser
  |
  v
Frontend Next.js
  |
  v
API Gateway Flask
  |-- rate limiting
  |-- proxy para servicos internos
  |-- logs estruturados
  |-- metricas de carga
  |-- health check agregado
  |-- balanceamento round-robin
  |
  +-- Hotel Service Flask :4101
  |     v
  |   SQLite local
  |
  +-- Hotel Service Flask :4102
  |     v
  |   SQLite local
  |
  +-- Auth Service Flask :4201
  |     |-- login com e-mail e senha
  |     |-- codigo enviado por e-mail
  |     |-- cria a carteira bonus apos validar o codigo
  |     v
  |   SQLite local
  |
  +-- Booking/Wallet Service Flask :4202
  |     |-- saldo demo de R$ 20.000 por usuario logado
  |     |-- reserva demo
  |     |-- transacoes de carteira
  |     v
  |   SQLite local
  |
  +-- Geolocation Service Flask :4204
  |     |-- coordenadas dos hoteis
  |     |-- base para mapa
  |     v
  |   SQLite local
  |
  +-- Validation Service Flask :4205
        |-- CPF
        |-- CEP
        |-- data de nascimento
        |-- dados do hospede
```

## Componentes

- `app/` e `components/`: frontend Next.js. A interface visual permanece desacoplada da arquitetura interna.
- `services/api-gateway`: Flask API de entrada. Aplica rate limiting, registra logs e expoe metricas.
- `services/hotel-service`: Flask API de busca e detalhe de hoteis. No `dev:all`, roda duas instancias nas portas `4101` e `4102` para demonstrar balanceamento.
- `services/auth-service`: Flask API de cadastro com e-mail/senha, login com e-mail/senha e codigo enviado ao e-mail da conta.
- `services/booking-service`: Flask API de carteira demo e reservas com desconto de saldo.
- `services/geolocation-service`: Flask API de coordenadas do hotel para uso em mapa.
- `services/validation-service`: Flask API para validar CPF, CEP, data de nascimento, telefone e dados do hospede antes da reserva.
- `infra/database`: schema e seed do SQLite.

Componentes opcionais:

- `services/media-service`: upload local simulando S3. Nao faz parte do fluxo principal atual.
- `services/hotel-service` tambem tem uma segunda instancia opcional na porta `4102`, usada apenas se `HOTEL_SERVICE_URLS` for configurado para testar balanceamento.

## Fluxos principais

1. O frontend acessa apenas o gateway.
2. O gateway roteia a requisicao para o servico correto.
3. O gateway alterna entre as instancias do hotel-service usando round-robin quando `HOTEL_SERVICE_URLS` tem mais de uma URL.
4. O hotel-service usa SQLite local, dados demo internos e um conjunto versionado de imagens unicas.
5. O auth-service emite um JWT Bearer apos login ou confirmacao de cadastro.
6. O booking-service valida o JWT antes de liberar carteira ou criar reservas.
7. O validation-service valida dados antes da reserva.
8. O booking-service controla carteira e reserva demo.

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
- `GET /health/services`
- `GET /metrics`
- `GET /api/hotels`
- `GET /api/hotels/:slug`
- `GET /api/geolocation/hotel/:slug`
- `GET /api/wallet/me`
- `GET /api/bookings/me`
- `POST /api/bookings`
- `PATCH /api/bookings/:id/cancel`
- `POST /api/auth/password/register`
- `POST /api/auth/password/register/confirm`
- `POST /api/auth/password/login`
- `GET /api/validation/health`
- `POST /api/validation/validate/reservation-guest`

Opcional:

- `POST /api/media/upload`

## Monitoramento

O gateway expõe `GET /metrics`, com total de requisicoes, bloqueios por rate limit, rotas mais acessadas, upstreams usados, erros e tempo medio.

Os logs sao estruturados em JSON e mostram metodo, rota, status, duracao e upstream.

O gateway tambem expoe `GET /health/services`, que consulta o `/health` de cada upstream configurado e mostra quais instancias estao `up`, `down` ou `degraded`. O `media-service` aparece como opcional; os demais servicos sao obrigatorios para o fluxo principal.

## Balanceamento

O `hotel-service` pode rodar em duas instancias locais:

```txt
http://localhost:4101
http://localhost:4102
```

Quando `HOTEL_SERVICE_URLS` contem as duas URLs, o API Gateway alterna as chamadas entre elas por round-robin. Isso permite demonstrar escalabilidade horizontal e tolerancia parcial a falhas.

## Autenticacao

O `auth-service` emite um JWT Bearer assinado com HS256 apos login ou confirmacao de cadastro. O frontend envia esse token no header:

```txt
Authorization: Bearer <token>
```

O `booking-service` valida esse JWT antes de liberar carteira, reservas e criacao de reserva demo.

## Fluxo de Reserva

```txt
usuario escolhe hotel
  -> abre detalhes do hotel
  -> seleciona um quarto
  -> vai para /hotel/:slug/quarto/:roomId
  -> escolhe check-in, check-out e hospedes
  -> sistema calcula diarias e total
  -> booking-service valida o JWT
  -> validation-service valida dados do hospede
  -> booking-service debita a carteira demo
  -> reserva aparece em /minhas-reservas
```

O cancelamento usa `PATCH /api/bookings/:id/cancel`, altera o status da reserva para `cancelled` e devolve o valor para a carteira demo.

## Backend Python

Os servicos de backend rodam em Flask, mantendo as mesmas portas, rotas, payloads e contratos consumidos pelo frontend. O frontend Next.js permanece inalterado.

Para instalar as dependencias Python:

```bash
pip install -r requirements.txt
```

## Evolucao futura

Hadoop ou Spark nao entram no fluxo principal da aplicacao. Eles ficam como camada futura de analytics para logs de busca e reservas.
