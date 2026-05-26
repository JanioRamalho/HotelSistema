# Viajei

Sistema academico de hoteis com frontend Next.js, API Gateway, microsservicos Node.js, validacao em Python e banco SQLite local.

## Arquitetura

A arquitetura detalhada do sistema fica em [docs/architecture.md](docs/architecture.md).

## Como Rodar

### Fluxo recomendado

Use o comando unico para subir todos os servicos locais:

```bash
npm run dev:all
```

Depois acesse:

```txt
http://localhost:3000
```

### Fluxo manual

Se quiser rodar servicos individualmente:

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

## Endpoints Uteis

```txt
http://localhost:4100/health
http://localhost:4100/metrics
http://localhost:4100/api/hotels
POST http://localhost:4100/api/hotels/generate
http://localhost:4205/health
```

## Gerar Hoteis Automaticamente

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

Os hoteis gerados sao persistidos no banco local e aparecem automaticamente no site pela rota `/api/hotels`.

## Seed e dados de demonstracao

Os dados falsos de hotel ficaram isolados em:

- `services/hotel-service/src/demo/fake-hotel-provider.js`

Esse local foi criado para separar a logica de demonstracao da logica real do servico, sem alterar o comportamento atual.

## Banco

O schema e o seed ficam em:

```txt
infra/database/schema.sql
infra/database/seed-hotels.sql
```

O arquivo `hoteis.db` e gerado localmente a partir desses SQLs.

## Padrões do projeto

### 1. Nomes

- Arquivos e pastas em `kebab-case`
- Variaveis e funcoes em `camelCase`
- Componentes React em `PascalCase`
- Servicos e ambientes com nomes claros e consistentes

### 2. Variaveis de ambiente

- Variaveis sempre em `UPPER_SNAKE_CASE`
- Nomes com contexto do servico quando aplicavel
- Exemplo: `HOTEL_SERVICE_URLS`, `PORT`, `SERVICE_NAME`, `EMAIL_PROVIDER`

### 3. Logs

- Logs em formato JSON estruturado
- Evitar mensagens soltas sem contexto
- Preferir dados consistentes como `service`, `event`, `status`, `path` e `durationMs`

### 4. Contrato frontend e gateway

- O frontend deve consumir apenas o gateway em `/api/*`
- O gateway e a porta de entrada unica da API
- Os microsservicos continuam internos e nao devem ser chamados diretamente pelo frontend

## Observacoes

- O `hotel-service` combina SQLite com uma Dummy API interna para popular varios estados e cidades.
- O `validation-service` e feito em Python e valida CPF, CEP, telefone, e-mail e data de nascimento.
- O envio real de e-mail depende das variaveis SMTP ou Resend configuradas no `.env`.

## Envio Real De Codigo Por E-mail

Para desenvolvimento local sem comprar dominio, use SMTP com senha de app do Gmail ou outro provedor.

No `.env`:

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

Para usar Resend de proposito, configure:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=sua_chave_resend
```

Sem dominio verificado, o Resend pode bloquear envios para e-mails diferentes do dono da conta.

## Fluxo De Cadastro

O cadastro usa pre-cadastro:

```txt
usuario preenche cadastro
  -> auth-service valida os dados
  -> salva em cadastros_pendentes
  -> envia codigo por e-mail
  -> usuario confirma o codigo
  -> usuario oficial e criado em usuarios
  -> carteira demo e liberada
```

Assim, se o envio do e-mail falhar, a conta nao fica criada em `usuarios`.
