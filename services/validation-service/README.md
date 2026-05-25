# Validation Service

Microsservico Python responsavel por regras de validacao usadas antes da reserva demo.

## Execucao

```bash
npm run dev:validation-service
```

Servico padrao:

```txt
http://localhost:4205
```

## Endpoints

- `GET /health`
- `POST /validate/cpf`
- `POST /validate/cep`
- `POST /validate/birthdate`
- `POST /validate/reservation-guest`

O `booking-service` usa `POST /validate/reservation-guest` antes de criar uma reserva.
