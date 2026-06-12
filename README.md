# Viajei

Sistema academico de hoteis com frontend Next.js, API Gateway em Flask, microsservicos Flask e banco SQLite local.

O projeto cobre o fluxo principal de uma plataforma de hospedagens:

- listagem, busca e detalhe de hoteis;
- cadastro, confirmacao por e-mail e login;
- carteira demo com saldo inicial;
- reserva e cancelamento com estorno;
- imagens principais de hoteis com atribuicao previsivel.

## Sumario

- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Como rodar](#como-rodar)
- [Comandos uteis](#comandos-uteis)
- [Portas dos servicos](#portas-dos-servicos)
- [Endpoints uteis](#endpoints-uteis)
- [Fluxos principais](#fluxos-principais)
- [Banco de dados](#banco-de-dados)
- [E-mail de verificacao](#e-mail-de-verificacao)
- [Padroes do projeto](#padroes-do-projeto)
- [Observacoes](#observacoes)

## Arquitetura

A descricao completa da arquitetura esta em [docs/architecture.md](docs/architecture.md).

Em resumo:

- o frontend consome apenas o API Gateway em `/api/*`;
- o API Gateway centraliza rate limiting, logs, metricas, health checks e proxy para os servicos;
- os microsservicos mantem responsabilidades separadas para hoteis, autenticacao, reservas, geolocalizacao, validacao e media;
- o `hotel-service` pode rodar em duas instancias para demonstrar balanceamento round-robin;
- o banco local da versao academica e SQLite.

## Tecnologias

- Next.js e React no frontend;
- Flask nos servicos backend;
- SQLite para persistencia local;
- JWT Bearer para rotas protegidas de carteira e reserva;
- logs estruturados em JSON no API Gateway.

## Como rodar

### 1. Instalar dependencias

```bash
npm install
python -m pip install -r requirements.txt
```

### 2. Subir o ambiente completo

```bash
npm run dev:all
```

Atencao: o comando correto tem dois-pontos: `npm run dev:all`.

### 3. Acessar a aplicacao

```txt
http://localhost:3000
```

### 4. Conferir a saude do projeto

```bash
npm run lint
npm run build
```

## Comandos uteis

### Rodar servicos individualmente

```bash
npm run dev:hotel-service:1
npm run dev:hotel-service:2
npm run dev:auth-service
npm run dev:booking-service
npm run dev:geolocation-service
npm run dev:validation-service
npm run dev:gateway
npm run dev
```

### Rodar servico opcional de media

```bash
npm run dev:media-service
```

O `dev:all` ja configura `HOTEL_SERVICE_URLS=http://localhost:4101,http://localhost:4102` para demonstrar balanceamento. No fluxo manual, configure essa variavel antes de subir o gateway se quiser usar as duas instancias do `hotel-service`.

## Portas dos servicos

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

## Endpoints uteis

```txt
GET    http://localhost:4100/health
GET    http://localhost:4100/health/services
GET    http://localhost:4100/metrics
GET    http://localhost:4100/api/hotels
GET    http://localhost:4100/api/hotels/resort-praia-do-forte
POST   http://localhost:4100/api/hotels/generate
GET    http://localhost:4100/api/bookings/me
POST   http://localhost:4100/api/bookings
PATCH  http://localhost:4100/api/bookings/:id/cancel
GET    http://localhost:4205/health
```

## Fluxos principais

### Cadastro

```txt
usuario preenche cadastro
  -> auth-service valida os dados
  -> salva em cadastros_pendentes
  -> envia codigo por e-mail
  -> usuario confirma o codigo
  -> usuario oficial e criado em usuarios
  -> carteira demo e liberada
```

Se o envio do e-mail falhar, a conta nao fica criada em `usuarios`.

### Login e autenticacao

Depois do login ou da confirmacao de cadastro, o `auth-service` retorna um JWT Bearer:

```json
{
  "data": {
    "user": {},
    "token": "...",
    "walletBonusCents": 2000000
  }
}
```

O frontend guarda o token na sessao local e envia nas rotas protegidas:

```txt
Authorization: Bearer <token>
```

### Reserva demo

```txt
usuario escolhe um hotel
  -> seleciona um quarto
  -> acessa /hotel/:slug/quarto/:roomId
  -> informa datas e dados do hospede
  -> sistema calcula noites x diaria
  -> usuario paga com saldo demo
  -> reserva aparece em /minhas-reservas
```

O cancelamento altera o status para `cancelled` e estorna o valor para a carteira demo.

## Gerar hoteis automaticamente

Com o API Gateway e o Hotel Service rodando, gere hoteis falsos completos no SQLite:

```bash
curl -X POST http://localhost:4100/api/hotels/generate \
  -H "Content-Type: application/json" \
  -d "{\"count\": 5}"
```

Tambem e possivel limitar por cidade ou estado:

```bash
curl -X POST http://localhost:4100/api/hotels/generate \
  -H "Content-Type: application/json" \
  -d "{\"count\": 3, \"state\": \"RJ\"}"
```

As imagens principais sao atribuidas pelo `hotel-service` a partir de:

```txt
services/hotel-service/src/data/unique-hotel-images.json
```

Essa regra evita improviso no frontend e mantem cada hotel com uma imagem principal previsivel.

## Banco de dados

O schema e o seed ficam em:

```txt
infra/database/schema.sql
infra/database/seed-hotels.sql
```

O arquivo `hoteis.db` e gerado localmente a partir desses SQLs.

Os dados falsos de hotel ficam isolados em:

```txt
services/hotel-service/src/fake_hotel_provider.py
```

## E-mail de verificacao

Para desenvolvimento local sem comprar dominio, use SMTP com senha de app do Gmail ou outro provedor.

Exemplo de `.env`:

```env
EMAIL_PROVIDER=console
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua_senha_de_app
SMTP_TIMEOUT_MS=15000
EMAIL_FROM=Viajei <seuemail@gmail.com>
```

Com SMTP configurado, o `auth-service` envia o codigo de verificacao por e-mail real. Se SMTP nao estiver configurado, o codigo aparece no terminal do `auth-service`.

Para usar Resend:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=sua_chave_resend
```

Sem dominio verificado, o Resend pode bloquear envios para e-mails diferentes do dono da conta.

## Padroes do projeto

### Nomes

- arquivos e pastas em `kebab-case`;
- variaveis e funcoes em `camelCase`;
- componentes React em `PascalCase`;
- servicos e ambientes com nomes claros e consistentes.

### Variaveis de ambiente

- variaveis em `UPPER_SNAKE_CASE`;
- nomes com contexto do servico quando aplicavel;
- exemplos: `HOTEL_SERVICE_URLS`, `PORT`, `SERVICE_NAME`, `EMAIL_PROVIDER`.

### Logs

- logs em JSON estruturado;
- mensagens com contexto;
- campos preferenciais: `service`, `event`, `status`, `path` e `durationMs`.

### Contrato frontend e gateway

- o frontend consome apenas o gateway em `/api/*`;
- o gateway e a porta de entrada unica da API;
- os microsservicos internos nao devem ser chamados diretamente pelo frontend.

## Observacoes

- O `media-service` e opcional e nao e necessario para navegar, buscar, abrir detalhes ou reservar hoteis.
- O `validation-service` valida CPF, CEP, telefone, e-mail, data de nascimento e dados do hospede.
- O envio real de e-mail depende das variaveis SMTP ou Resend configuradas no `.env`.
- Se estiver no Windows e houver erro ao executar um programa, use a branch atualizada; o runner Python resolve automaticamente o caminho do `npm.cmd`.
