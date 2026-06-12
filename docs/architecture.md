# Arquitetura do Viajei

Este documento descreve a organizacao tecnica do Viajei, os servicos backend, os fluxos principais e os pontos de integracao entre frontend, gateway e microsservicos.

## Visao geral

```txt
Browser
  |
  v
Frontend Next.js :3000
  |
  v
API Gateway Flask :4100
  |-- rate limiting
  |-- proxy para servicos internos
  |-- logs estruturados
  |-- metricas
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
  |     |-- cadastro com confirmacao por e-mail
  |     |-- login com e-mail e senha
  |     |-- emissao de JWT Bearer
  |     v
  |   SQLite local
  |
  +-- Booking/Wallet Service Flask :4202
  |     |-- carteira demo
  |     |-- criacao e cancelamento de reservas
  |     |-- transacoes de saldo
  |     v
  |   SQLite local
  |
  +-- Geolocation Service Flask :4204
  |     |-- coordenadas dos hoteis
  |     |-- dados para mapa
  |     v
  |   SQLite local
  |
  +-- Validation Service Flask :4205
        |-- CPF
        |-- CEP
        |-- telefone
        |-- data de nascimento
        |-- dados do hospede
```

## Responsabilidades

| Componente | Responsabilidade |
| --- | --- |
| `app/` e `components/` | Frontend Next.js e componentes React. |
| `services/api-gateway` | Entrada unica da API, proxy, rate limiting, logs, metricas e health checks. |
| `services/hotel-service` | Busca, detalhe, geracao demo e imagens principais de hoteis. |
| `services/auth-service` | Cadastro, confirmacao por e-mail, login e emissao de JWT. |
| `services/booking-service` | Carteira demo, reservas, cancelamento e transacoes. |
| `services/geolocation-service` | Coordenadas de hoteis para recursos de mapa. |
| `services/validation-service` | Validacao de dados pessoais e dados de reserva. |
| `infra/database` | Schema e seed do SQLite. |

Componentes opcionais:

- `services/media-service`: upload local simulando S3. Nao faz parte do fluxo principal atual.
- segunda instancia do `hotel-service` na porta `4102`: usada para demonstrar balanceamento quando `HOTEL_SERVICE_URLS` contem mais de uma URL.

## Principios da arquitetura

- O frontend acessa apenas o API Gateway.
- O gateway expoe o contrato publico em `/api/*`.
- Os microsservicos permanecem internos e isolados por responsabilidade.
- O `booking-service` valida JWT antes de liberar carteira ou reservas.
- O `validation-service` centraliza validacoes reutilizaveis.
- O `hotel-service` concentra as regras de dados e imagens de hoteis.
- O SQLite atende ao objetivo academico e de demonstracao local.

## Comunicacao entre servicos

1. O navegador acessa o frontend em `http://localhost:3000`.
2. O frontend chama o gateway em `http://localhost:4100/api/*`.
3. O gateway identifica a rota e encaminha para o servico correto.
4. Quando ha mais de uma URL em `HOTEL_SERVICE_URLS`, o gateway alterna as chamadas do `hotel-service` por round-robin.
5. Servicos protegidos validam JWT Bearer antes de acessar dados do usuario.
6. Respostas retornam pelo gateway para manter um unico ponto de entrada para o frontend.

## Portas

| Porta | Servico |
| --- | --- |
| 3000 | Frontend Next.js |
| 4100 | API Gateway |
| 4101 | Hotel Service |
| 4102 | Hotel Service, segunda instancia |
| 4201 | Auth Service |
| 4202 | Booking/Wallet Service |
| 4204 | Geolocation Service |
| 4205 | Validation Service |

## Endpoints principais

### Gateway

```txt
GET    /health
GET    /health/services
GET    /metrics
GET    /api/hotels
GET    /api/hotels/:slug
POST   /api/hotels/generate
GET    /api/geolocation/hotel/:slug
GET    /api/wallet/me
GET    /api/bookings/me
POST   /api/bookings
PATCH  /api/bookings/:id/cancel
POST   /api/auth/password/register
POST   /api/auth/password/register/confirm
POST   /api/auth/password/login
GET    /api/validation/health
POST   /api/validation/validate/reservation-guest
```

### Opcional

```txt
POST   /api/media/upload
```

## Banco de dados

O banco principal da versao academica e SQLite local:

```txt
hoteis.db
```

Arquivos versionados:

```txt
infra/database/schema.sql
infra/database/seed-hotels.sql
```

As tabelas armazenam hoteis, quartos, imagens, comodidades, usuarios, verificacoes de e-mail, reservas, favoritos, carteiras e transacoes.

## Autenticacao

O `auth-service` emite um JWT Bearer assinado com HS256 apos login ou confirmacao de cadastro.

O frontend envia o token nas rotas protegidas:

```txt
Authorization: Bearer <token>
```

O `booking-service` valida esse token antes de liberar:

- saldo da carteira;
- listagem de reservas;
- criacao de reserva;
- cancelamento de reserva.

## Fluxos principais

### Cadastro

```txt
usuario preenche cadastro
  -> auth-service valida os dados
  -> salva em cadastros_pendentes
  -> envia codigo por e-mail
  -> usuario confirma o codigo
  -> usuario e criado em usuarios
  -> carteira demo e liberada
```

### Login

```txt
usuario informa e-mail e senha
  -> auth-service valida as credenciais
  -> auth-service emite JWT Bearer
  -> frontend guarda o token na sessao local
  -> rotas protegidas usam Authorization: Bearer <token>
```

### Reserva

```txt
usuario escolhe hotel
  -> abre detalhes do hotel
  -> seleciona um quarto
  -> vai para /hotel/:slug/quarto/:roomId
  -> informa check-in, check-out e hospedes
  -> sistema calcula noites e total
  -> booking-service valida o JWT
  -> validation-service valida dados do hospede
  -> booking-service debita a carteira demo
  -> reserva aparece em /minhas-reservas
```

O cancelamento usa `PATCH /api/bookings/:id/cancel`, altera o status da reserva para `cancelled` e devolve o valor para a carteira demo.

## Monitoramento

O gateway expoe `GET /metrics` com:

- total de requisicoes;
- bloqueios por rate limit;
- rotas mais acessadas;
- upstreams usados;
- erros;
- tempo medio de resposta.

Os logs sao estruturados em JSON e incluem metodo, rota, status, duracao e upstream.

O endpoint `GET /health/services` consulta o `/health` dos upstreams configurados e informa se cada instancia esta `up`, `down` ou `degraded`. O `media-service` aparece como opcional; os demais servicos sao obrigatorios para o fluxo principal.

## Balanceamento

O `hotel-service` pode rodar em duas instancias locais:

```txt
http://localhost:4101
http://localhost:4102
```

Quando `HOTEL_SERVICE_URLS` contem as duas URLs, o API Gateway alterna as chamadas por round-robin. Isso permite demonstrar escalabilidade horizontal e tolerancia parcial a falhas.

## Backend Python

Os servicos de backend rodam em Flask, mantendo as mesmas portas, rotas, payloads e contratos consumidos pelo frontend.

Para instalar as dependencias Python:

```bash
python -m pip install -r requirements.txt
```

## Evolucao futura

Hadoop ou Spark nao entram no fluxo principal da aplicacao. Eles ficam como possibilidade futura para analytics de logs de busca e reservas.
