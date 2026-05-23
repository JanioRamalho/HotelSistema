# Arquitetura Distribuida Do HotelSistema

Este projeto esta sendo preparado para sair de um frontend com dados estaticos e evoluir para uma arquitetura distribuida com gateway, microsservicos, banco SQL local, storage de imagens e infraestrutura reproduzivel.

## Desenho Inicial

```txt
Browser
  |
  v
Next.js Web App
  |
  v
API Gateway
  |
  +-- Hotel Service
  |     +-- SQLite local
  +-- Auth Service
  +-- Booking Service
  +-- User Service
  +-- Media Service
  +-- Geolocation Service
  +-- Recommendation Service
```

## Infraestrutura Local

O arquivo `infra/docker-compose.yml` sobe a primeira base:

- `api-gateway`: entrada unica para o frontend.
- `hotel-service-a` e `hotel-service-b`: duas instancias do servico de hoteis.
- `postgres`: banco transacional opcional/local para uma evolucao futura.
- `redis`: cache, rate limit e filas leves.
- `minio`: storage compativel com S3 para imagens.

O gateway faz round-robin entre as instancias do `hotel-service` usando `HOTEL_SERVICE_URLS`.
O `hotel-service` usa SQLite local como fonte principal de dados, com banco padrao em `hoteis.db`.

## Banco SQL Local

O schema oficial fica versionado em `infra/database/schema.sql`.
O seed inicial fica em `infra/database/seed-hotels.sql`.

O modelo prepara:

- hoteis, imagens, quartos, comodidades e avaliacoes;
- usuarios, favoritos, reservas e verificacoes de email;
- latitude e longitude para a futura geolocalizacao por endereco;
- metadados `s3_key`, dimensoes e tamanho para a futura integracao MinIO/S3.
- uma troca futura para Cloudflare D1, Turso/libSQL ou PostgreSQL sem alterar o frontend.

## Endpoints Da Primeira Fase

Gateway:

- `GET /health`
- `GET /api/hotels`
- `GET /api/hotels/:slug`
- `GET /api/cities`
- `GET /api/states`
- `GET /api/auth/google` retorna `501` por enquanto, reservado para o futuro `auth-service`.

Hotel Service:

- `GET /health`
- `GET /hotels`
- `GET /hotels/:slug`
- `GET /cities`
- `GET /states`

Filtros aceitos em `GET /hotels`:

- `city`
- `state`
- `guests`
- `priceMin`
- `priceMax`
- `amenities`, separados por virgula
- `minRating`
- `stars`, separados por virgula

## Proximas Etapas

1. Migrar a tela `/busca` para consumir `http://localhost:4100/api/hotels`. Concluido.
2. Migrar a tela `/hotel/[slug]` para consumir `http://localhost:4100/api/hotels/:slug`. Concluido.
3. Criar schema SQL com hoteis, quartos, imagens, usuarios, verificacoes de email e reservas. Concluido.
4. Criar seed SQL inicial. Concluido.
5. Atualizar `hotel-service` para consultar SQLite local. Concluido.
6. Migrar o seed para conter todos os hoteis de `features/hotels/hotel-data.ts`.
7. Criar `auth-service` com login, Google OAuth e envio de codigo por email para verificacao.
8. Criar `geolocation-service` para converter endereco de hotel em latitude/longitude e calcular distancia.
9. Criar `media-service` para upload no MinIO/S3 e geracao de thumbnails.
10. Criar `booking-service` com disponibilidade e reserva real.
11. Adicionar observabilidade, logs estruturados e health checks mais completos.
12. Evoluir o `docker-compose` para Kubernetes quando os contratos estiverem estaveis.
