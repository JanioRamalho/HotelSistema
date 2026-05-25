import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { databaseInfo, db } from './database/sqlite-client.js'

const port = Number(process.env.PORT || 4202)
const serviceName = process.env.SERVICE_NAME || 'booking-service'
const validationServiceUrl = process.env.VALIDATION_SERVICE_URL || 'http://localhost:4205'

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-user-id',
  })
  res.end(JSON.stringify(payload))
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function nightsBetween(checkIn, checkOut) {
  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  const diff = Math.ceil((end.getTime() - start.getTime()) / 86_400_000)
  return Number.isFinite(diff) ? diff : 0
}

function getWallet(userId) {
  return db()
    .prepare('SELECT usuario_id AS user_id, saldo_centavos AS balance_cents FROM carteiras WHERE usuario_id = ?')
    .get(userId)
}

function getAuthenticatedUserId(req) {
  const userId = req.headers['x-user-id']
  return typeof userId === 'string' && userId.trim() ? userId.trim() : undefined
}

async function validateReservationGuest(payload) {
  let response

  try {
    response = await fetch(`${validationServiceUrl}/validate/reservation-guest`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.guestName,
        email: payload.guestEmail,
        phone: payload.guestPhone,
        cpf: payload.guestDocument,
        cep: payload.guestZipCode,
        birthdate: payload.guestBirthdate,
        minimumAge: 18,
      }),
    })
  } catch (error) {
    return {
      valid: false,
      status: 502,
      payload: {
        error: 'validation_service_unavailable',
        message: 'Servico Python de validacao indisponivel.',
      },
    }
  }

  const body = await response.json().catch(() => ({}))

  if (!response.ok || body.valid === false) {
    return {
      valid: false,
      status: 422,
      payload: {
        error: 'invalid_guest_data',
        message: 'Revise os dados do hospede antes de concluir a reserva.',
        details: body.errors || [],
      },
    }
  }

  return { valid: true, normalized: body.normalized || {} }
}

function listBookings(userId) {
  return db().prepare(
    `SELECT
       b.id,
       b.usuario_id AS user_id,
       b.hotel_id,
       b.quarto_id AS room_id,
       b.check_in,
       b.check_out,
       b.hospedes AS guests,
       b.preco_total AS total_price,
       b.status,
       b.nome_hospede AS guest_name,
       b.email_hospede AS guest_email,
       b.telefone_hospede AS guest_phone,
       b.documento_hospede AS guest_document,
       b.pedidos_especiais AS special_requests,
       b.criado_em AS created_at,
       h.nome AS hotel_name,
       q.nome AS room_name
     FROM reservas b
     JOIN hoteis h ON h.id = b.hotel_id
     JOIN quartos q ON q.id = b.quarto_id
     WHERE b.usuario_id = ?
     ORDER BY b.criado_em DESC`
  ).all(userId)
}

async function createBooking(payload, userId) {
  const room = db().prepare(
    `SELECT
       q.id,
       q.hotel_id,
       q.preco AS price,
       q.capacidade AS capacity,
       h.nome AS hotel_name
     FROM quartos q
     JOIN hoteis h ON h.id = q.hotel_id
     WHERE q.id = ?`
  ).get(payload.roomId)

  if (!room) {
    return { status: 404, payload: { error: 'room_not_found' } }
  }

  const nights = nightsBetween(payload.checkIn, payload.checkOut)
  if (nights <= 0) {
    return { status: 400, payload: { error: 'invalid_dates', message: 'Check-out deve ser depois do check-in.' } }
  }

  const guests = Number(payload.guests || 1)
  if (guests > room.capacity) {
    return { status: 400, payload: { error: 'room_capacity_exceeded' } }
  }

  const validation = await validateReservationGuest(payload)
  if (!validation.valid) {
    return { status: validation.status, payload: validation.payload }
  }

  const totalCents = room.price * nights * 100
  const wallet = getWallet(userId)

  if (!wallet) {
    return { status: 404, payload: { error: 'wallet_not_found' } }
  }

  if (wallet.balance_cents < totalCents) {
    return { status: 409, payload: { error: 'insufficient_demo_balance' } }
  }

  const bookingId = randomUUID()
  const transactionId = randomUUID()

  db().exec('BEGIN')
  try {
    db().prepare(
      `INSERT INTO reservas (
        id, usuario_id, hotel_id, quarto_id, check_in, check_out, hospedes, preco_total, status,
        nome_hospede, email_hospede, telefone_hospede, documento_hospede, pedidos_especiais
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?)`
    ).run(
      bookingId,
      userId,
      room.hotel_id,
      room.id,
      payload.checkIn,
      payload.checkOut,
      guests,
      totalCents / 100,
      validation.normalized.name,
      validation.normalized.email,
      validation.normalized.phone,
      validation.normalized.cpf,
      payload.specialRequests || null
    )
    db()
      .prepare('UPDATE carteiras SET saldo_centavos = saldo_centavos - ?, atualizado_em = CURRENT_TIMESTAMP WHERE usuario_id = ?')
      .run(totalCents, userId)
    db().prepare(
      `INSERT INTO transacoes_carteira (id, usuario_id, reserva_id, tipo, valor_centavos, descricao)
       VALUES (?, ?, ?, 'debit', ?, ?)`
    ).run(transactionId, userId, bookingId, totalCents, `Reserva demo em ${room.hotel_name}`)
    db().exec('COMMIT')
  } catch (error) {
    db().exec('ROLLBACK')
    throw error
  }

  return {
    status: 201,
    payload: {
      data: {
        bookingId,
        userId,
        hotelId: room.hotel_id,
        roomId: room.id,
        nights,
        totalCents,
        remainingBalanceCents: wallet.balance_cents - totalCents,
      },
    },
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok', service: serviceName, port, ...databaseInfo() })
    return
  }

  try {
    if (req.method === 'GET' && url.pathname === '/wallet/me') {
      const userId = getAuthenticatedUserId(req)
      if (!userId) {
        sendJson(res, 401, { error: 'login_required', message: 'Faca login para acessar sua carteira demo.' })
        return
      }

      const wallet = getWallet(userId)
      if (!wallet) {
        sendJson(res, 404, { error: 'wallet_not_found', message: 'Carteira demo nao encontrada para esta conta.' })
        return
      }

      sendJson(res, 200, { data: wallet })
      return
    }

    if (req.method === 'GET' && url.pathname === '/bookings/me') {
      const userId = getAuthenticatedUserId(req)
      if (!userId) {
        sendJson(res, 401, { error: 'login_required', message: 'Faca login para ver suas reservas.' })
        return
      }

      sendJson(res, 200, { data: listBookings(userId) })
      return
    }

    if (req.method === 'POST' && url.pathname === '/bookings') {
      const userId = getAuthenticatedUserId(req)
      if (!userId) {
        sendJson(res, 401, { error: 'login_required', message: 'Faca login para concluir sua reserva demo.' })
        return
      }

      const result = await createBooking(await readJson(req), userId)
      sendJson(res, result.status, result.payload)
      return
    }
  } catch (error) {
    sendJson(res, 500, { error: 'booking_service_error', message: error instanceof Error ? error.message : 'Unknown error' })
    return
  }

  sendJson(res, 404, { error: 'not_found' })
})

server.listen(port, () => {
  console.log(`${serviceName} listening on http://localhost:${port}`)
})
