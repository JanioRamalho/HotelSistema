# Banco SQL Local Do HotelSistema

Esta pasta versiona o schema e o seed inicial do banco SQLite usado pelo `hotel-service`.

## Arquivos

- `schema.sql`: tabelas, chaves estrangeiras e indices.
- `seed-hotels.sql`: dados iniciais de comodidades, hoteis, quartos, imagens e avaliacoes.

## Como Funciona

O `hotel-service` usa SQLite local como fonte principal de dados. Por padrao, o arquivo fica na raiz do projeto:

```txt
hoteis.db
```

Ao iniciar, o servico aplica automaticamente:

```txt
infra/database/schema.sql
infra/database/seed-hotels.sql
```

Isso garante que o grupo consiga rodar o projeto sem conta em nuvem, token ou Docker.

## Variavel Opcional

Se quiser usar outro caminho para o banco:

```env
SQLITE_DATABASE_PATH=./hoteis.db
```

## Teste Rapido

Rode:

```bash
npm run dev:hotel-service
```

Abra:

```txt
http://localhost:4101/health
```

A resposta deve conter:

```json
{
  "dataSource": "sqlite-local"
}
```

## Evolucao Futura

Para uma versao em nuvem, o mesmo desenho permite trocar o acesso interno do `hotel-service` para Cloudflare D1, Turso/libSQL ou PostgreSQL sem mudar o frontend nem o API Gateway.
