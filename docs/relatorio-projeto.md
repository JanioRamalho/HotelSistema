# Relatorio do Projeto Viajei

## 1. Resumo geral

O Viajei e um sistema academico de reserva de hoteis. Ele simula uma plataforma de hospedagens com frontend web, API Gateway, microsservicos Flask e banco SQLite local.

O sistema permite:

- visualizar uma pagina inicial de apresentacao da plataforma;
- buscar hoteis por cidade, estado, preco, estrelas, avaliacao e comodidades;
- ordenar resultados por preco, avaliacao ou estrelas;
- abrir a pagina detalhada de um hotel;
- visualizar galeria de imagens, comodidades, quartos, avaliacoes, politicas e localizacao;
- cadastrar usuario com validacao de dados;
- confirmar cadastro por codigo enviado por e-mail ou exibido no console;
- fazer login com e-mail e senha;
- receber uma carteira demo com saldo inicial;
- reservar quartos usando saldo demo;
- validar dados do hospede antes da reserva;
- listar reservas do usuario;
- cancelar reservas e receber estorno na carteira demo;
- consultar saude dos servicos;
- consultar metricas do API Gateway;
- demonstrar balanceamento entre duas instancias do servico de hoteis.

Em termos praticos, o projeto esta organizado como uma aplicacao web completa, mas com foco academico: ele demonstra arquitetura distribuida localmente, usando processos separados em portas diferentes.

## 2. Arquitetura implementada

Fluxo principal da arquitetura:

```txt
Usuario no navegador
  -> Frontend Next.js em http://localhost:3000
  -> API Gateway Flask em http://localhost:4100
  -> Microsservicos Flask
     -> hotel-service em http://localhost:4101
     -> hotel-service segunda instancia em http://localhost:4102
     -> auth-service em http://localhost:4201
     -> booking-service em http://localhost:4202
     -> geolocation-service em http://localhost:4204
     -> validation-service em http://localhost:4205
     -> media-service opcional em http://localhost:4203
  -> Banco SQLite local hoteis.db
```

O frontend nao chama os microsservicos diretamente. Ele conversa com o API Gateway usando rotas `/api/*`. O Gateway recebe a requisicao, aplica regras comuns e encaminha para o servico responsavel.

## 3. O que cada parte faz

### Frontend Next.js

Responsavel pelas telas e experiencia do usuario:

- `app/page.tsx`: pagina inicial;
- `app/busca/page.tsx`: busca, filtros e ordenacao de hoteis;
- `app/hotel/[slug]/page.tsx`: detalhe de hotel;
- `app/hotel/[slug]/quarto/[roomId]/page.tsx`: fluxo de reserva de quarto;
- `app/login/page.tsx`: login por e-mail e senha;
- `app/cadastro/page.tsx`: cadastro e confirmacao;
- `app/minhas-reservas/page.tsx`: listagem e cancelamento de reservas.

### API Gateway

Fica em `services/api-gateway`.

Responsabilidades:

- ponto unico de entrada da API;
- proxy para os microsservicos;
- CORS;
- rate limiting por IP;
- logs estruturados em JSON;
- metricas em `/metrics`;
- health check simples em `/health`;
- health check agregado em `/health/services`;
- balanceamento round-robin para o `hotel-service`.

### Hotel Service

Fica em `services/hotel-service`.

Responsabilidades:

- listar hoteis;
- filtrar por cidade, estado, preco, estrelas, avaliacao, comodidades e capacidade;
- buscar hotel por slug;
- retornar quartos, imagens, avaliacoes, politicas e contato;
- gerar hoteis fake via `/hotels/generate`;
- combinar dados do SQLite com catalogo dummy;
- atribuir imagens principais previsiveis aos hoteis.

### Auth Service

Fica em `services/auth-service`.

Responsabilidades:

- cadastro com nome, e-mail, senha e dados pessoais;
- validacao dos dados usando o validation-service;
- cadastro pendente ate confirmacao por codigo;
- envio de codigo por SMTP, Resend ou console;
- confirmacao de cadastro;
- login por e-mail e senha;
- emissao de JWT Bearer;
- criacao/liberacao da carteira demo do usuario.

### Booking/Wallet Service

Fica em `services/booking-service`.

Responsabilidades:

- validar JWT nas rotas protegidas;
- consultar saldo da carteira demo;
- criar reserva;
- validar datas, capacidade do quarto e dados do hospede;
- chamar o validation-service;
- debitar saldo demo;
- registrar transacao;
- listar reservas do usuario;
- cancelar reserva;
- estornar saldo para a carteira demo.

### Validation Service

Fica em `services/validation-service`.

Responsabilidades:

- validar CPF;
- validar CEP;
- validar telefone;
- validar e-mail;
- validar idade minima;
- validar dados completos de hospede/reserva.

### Geolocation Service

Fica em `services/geolocation-service`.

Responsabilidades:

- retornar endereco e coordenadas do hotel;
- apoiar a exibicao de mapa na tela de detalhe.

### Media Service

Fica em `services/media-service`.

Responsabilidades:

- simular upload local parecido com uma camada S3;
- salvar bytes em uma pasta local;
- retornar URL simulada do arquivo.

Este servico e opcional no fluxo atual.

## 4. Conceitos de sistemas distribuidos presentes

O trabalho apresenta os seguintes conceitos:

- Arquitetura em microsservicos: cada dominio tem seu proprio servico.
- API Gateway: uma entrada unica para o frontend.
- Comunicacao HTTP entre componentes: frontend -> gateway -> servicos.
- Separacao de responsabilidades: hotel, autenticacao, reserva, validacao, geolocalizacao e media.
- Balanceamento de carga: o Gateway alterna chamadas entre `hotel-service:4101` e `hotel-service:4102`.
- Escalabilidade horizontal demonstrada: duas instancias do mesmo servico de hotel podem rodar em paralelo.
- Tolerancia parcial a falhas: o Gateway tenta outra instancia do hotel-service quando uma falha.
- Health checks: cada servico tem `/health`, e o Gateway agrega tudo em `/health/services`.
- Monitoramento basico: endpoint `/metrics` com total de requisicoes, erros, rotas e upstreams.
- Logs estruturados: eventos do Gateway sao impressos em JSON.
- Rate limiting: limite simples por IP para evitar excesso de requisicoes.
- Autenticacao distribuida com JWT: o auth-service emite token e o booking-service valida.
- Contrato de API: o frontend depende do Gateway e nao conhece diretamente os servicos internos.
- Servico de validacao reutilizavel: auth-service e booking-service usam o validation-service.
- Persistencia compartilhada local: os servicos usam SQLite para a versao academica.
- Configuracao por variaveis de ambiente: URLs, portas, segredo JWT, SMTP e timeouts ficam no `.env`.

## 5. Fluxos implementados

### Fluxo de busca de hotel

```txt
Usuario abre /busca
  -> frontend monta filtros
  -> chama GET /api/hotels/unique-images no Gateway
  -> Gateway encaminha para hotel-service
  -> hotel-service consulta SQLite e dados dummy
  -> hotel-service aplica filtros
  -> Gateway retorna resultado ao frontend
  -> frontend mostra cards de hotel
```

### Fluxo de detalhe do hotel

```txt
Usuario clica em um hotel
  -> frontend abre /hotel/:slug
  -> chama GET /api/hotels/:slug
  -> Gateway encaminha ao hotel-service
  -> hotel-service retorna hotel completo
  -> frontend mostra imagens, quartos, comodidades, politicas e avaliacoes
  -> frontend chama geolocation-service pelo Gateway
  -> mapa e endereco sao exibidos
```

### Fluxo de cadastro

```txt
Usuario preenche cadastro
  -> frontend chama POST /api/auth/password/register
  -> Gateway encaminha para auth-service
  -> auth-service chama validation-service
  -> validation-service valida dados pessoais
  -> auth-service grava cadastro pendente
  -> auth-service envia codigo por e-mail ou console
  -> usuario informa codigo
  -> auth-service confirma cadastro
  -> usuario e criado em usuarios
  -> carteira demo e liberada
  -> auth-service retorna JWT
```

### Fluxo de login

```txt
Usuario informa e-mail e senha
  -> frontend chama POST /api/auth/password/login
  -> Gateway encaminha para auth-service
  -> auth-service confere senha e e-mail verificado
  -> auth-service retorna usuario e JWT
  -> frontend salva sessao no localStorage
```

### Fluxo de reserva

```txt
Usuario escolhe quarto
  -> abre /hotel/:slug/quarto/:roomId
  -> informa datas, hospedes e dados pessoais
  -> frontend calcula resumo
  -> frontend chama POST /api/bookings com JWT
  -> Gateway encaminha para booking-service
  -> booking-service valida JWT
  -> booking-service valida quarto, datas e capacidade
  -> booking-service chama validation-service
  -> validation-service valida dados do hospede
  -> booking-service confere saldo demo
  -> booking-service cria reserva confirmada
  -> booking-service debita carteira demo
  -> booking-service registra transacao
  -> frontend redireciona para minhas reservas
```

### Fluxo de cancelamento

```txt
Usuario abre /minhas-reservas
  -> frontend chama GET /api/bookings/me
  -> booking-service retorna reservas do usuario
  -> usuario cancela uma reserva
  -> frontend chama PATCH /api/bookings/:id/cancel
  -> booking-service valida usuario dono da reserva
  -> status vira cancelled
  -> valor e estornado na carteira demo
  -> transacao de credito e registrada
```

## 6. Requisitos para rodar em uma maquina nova

### Programas que precisam ser baixados

1. Git
   - Necessario para clonar ou baixar o projeto.

2. Node.js LTS
   - Recomendado: Node.js 20 ou superior.
   - O `npm` ja vem junto com o Node.js.
   - Necessario para instalar dependencias e rodar o Next.js.

3. Python
   - Recomendado: Python 3.11 ou 3.12.
   - Marcar a opcao "Add Python to PATH" no Windows.
   - Necessario para rodar os servicos Flask.

4. Dependencias JavaScript
   - Instaladas com:

```bash
npm install
```

5. Dependencias Python
   - O arquivo `requirements.txt` exige:

```txt
Flask>=3.0,<4.0
PyJWT>=2.8,<3.0
```

   - Instalacao:

```bash
python -m pip install -r requirements.txt
```

6. Arquivo `.env`
   - Criar a partir do `.env.example`.
   - Comandos:

```bash
copy .env.example .env
```

   - Para desenvolvimento simples, pode usar:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:4100
SQLITE_DATABASE_PATH=./hoteis.db
FRONTEND_URL=http://localhost:3000
UPSTREAM_TIMEOUT_MS=15000
AUTH_TOKEN_SECRET=dev-secret-change-me-32-bytes-minimum
HOTEL_SERVICE_URLS=http://localhost:4101,http://localhost:4102
EMAIL_PROVIDER=console
VALIDATION_SERVICE_URL=http://localhost:4205
VALIDATION_SERVICE_URLS=http://localhost:4205
```

   - Para envio real de e-mail, configurar SMTP ou Resend.

### Comando principal para rodar

```bash
npm run dev:all
```

Depois acessar:

```txt
http://localhost:3000
```

### Portas usadas

```txt
3000 - Frontend Next.js
4100 - API Gateway
4101 - Hotel Service instancia 1
4102 - Hotel Service instancia 2
4201 - Auth Service
4202 - Booking/Wallet Service
4203 - Media Service opcional
4204 - Geolocation Service
4205 - Validation Service
```

## 7. Comandos de verificacao

Typecheck:

```bash
npm run lint
```

Build:

```bash
npm run build
```

Health do Gateway:

```txt
http://localhost:4100/health
```

Health agregado:

```txt
http://localhost:4100/health/services
```

Metricas:

```txt
http://localhost:4100/metrics
```

## 8. Resultado da verificacao atual

No ambiente atual:

- `npm run lint` passou com sucesso.
- `npm run build` falhou porque o Next.js tentou baixar as fontes Google `Inter` e `Playfair Display`, mas o ambiente nao conseguiu acessar `fonts.googleapis.com`.

Isso nao indica erro de TypeScript. E uma pendencia operacional de build offline/rede. Para evitar esse problema em uma entrega mais robusta, o ideal seria:

- usar fontes locais no projeto; ou
- garantir internet durante o build; ou
- trocar `next/font/google` por arquivos locais via `next/font/local`.

## 9. Pontos fortes do projeto

- Boa separacao entre frontend, gateway e servicos.
- Fluxo principal de hotel e reserva esta bem completo.
- Usa conceitos reais de sistemas distribuidos, nao apenas uma simulacao textual.
- API Gateway tem metricas, logs, health checks e rate limiting.
- Ha demonstracao clara de balanceamento com duas instancias do hotel-service.
- JWT protege carteira e reservas.
- Validation-service evita duplicacao de regras de validacao.
- README e documento de arquitetura ja estao bons para apresentacao.
- Script `npm run dev:all` facilita subir a stack completa.

## 10. Pontos de melhoria

- O banco SQLite e compartilhado entre servicos; para um sistema distribuido real, cada servico teria sua propria base ou uma separacao mais forte de dados.
- Senhas sao armazenadas com SHA-256 simples; em producao, o correto seria usar bcrypt, argon2 ou scrypt com salt.
- Nao ha testes automatizados de backend ou testes end-to-end.
- O build depende de baixar fontes externas em tempo de compilacao.
- O `media-service` existe, mas e opcional e pouco integrado ao fluxo principal.
- O e-mail real depende de configuracao externa de SMTP/Resend.
- O projeto nao tem Docker Compose; isso ajudaria muito a rodar em maquina nova.

## 11. Nota geral

Nota geral sugerida: 8,5/10.

Justificativa:

O projeto esta forte para um trabalho academico de sistemas distribuidos. Ele demonstra microsservicos, API Gateway, balanceamento, health checks, metricas, JWT, rate limiting, validacao centralizada e comunicacao entre servicos. Alem disso, o fluxo funcional de busca, cadastro, login, reserva e cancelamento esta bem amarrado.

Nao dou nota maior principalmente por tres motivos: ausencia de testes automatizados, uso de SQLite compartilhado entre servicos e dependencia de rede para build por causa das fontes Google. Com testes, fontes locais e uma configuracao Docker Compose, o projeto ficaria bem perto de uma entrega 9+.
