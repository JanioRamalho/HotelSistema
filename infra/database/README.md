# Banco SQL Local Do Viajei

Esta pasta versiona o schema e o seed inicial do banco SQLite usado pelo `hotel-service`.

## Arquivos

- `schema.sql`: tabelas em portugues, chaves estrangeiras e indices.
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

Para uma versao em nuvem, o mesmo desenho permite trocar o acesso interno dos servicos para Cloudflare D1, Turso/libSQL ou PostgreSQL sem mudar o frontend nem o API Gateway.

O schema usa nomes em portugues para facilitar a apresentacao do modelo:

- `hoteis`, `quartos`, `imagens_hotel`, `imagens_quarto`
- `comodidades`, `hoteis_comodidades`, `quartos_comodidades`
- `usuarios`, `verificacoes_email`
- `reservas`, `favoritos`, `carteiras`, `transacoes_carteira`

As APIs continuam respondendo no formato usado pelo frontend, entao a traducao do banco nao muda a interface visual.

A carteira demo nao e criada como usuario solto no seed. Ela passa a ser criada quando uma pessoa faz login no fluxo demo, ficando registrada em `carteiras.usuario_id` com saldo inicial de R$ 20.000.
