# Viajei

Sistema academico de hoteis com frontend Next.js, API Gateway, microsservicos Node.js, validacao em Python e banco SQLite local.

## Arquitetura

```txt
Frontend Next.js
  -> API Gateway
    -> Hotel Service cluster
    -> Auth Service
    -> Booking/Wallet Service
    -> Media Service
    -> Geolocation Service
    -> Validation Service Python
    -> SQLite
```

## Como Rodar

Abra terminais separados:

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

Depois acesse:

```txt
http://localhost:3000
```

## Endpoints Uteis

```txt
http://localhost:4100/health
http://localhost:4100/metrics
http://localhost:4100/api/hotels
http://localhost:4205/health
```

## Banco

O schema e o seed ficam em:

```txt
infra/database/schema.sql
infra/database/seed-hotels.sql
```

O arquivo `hoteis.db` e gerado localmente a partir desses SQLs.

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
