import { createServer } from 'node:http'
import { createHash, randomInt, randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import net from 'node:net'
import tls from 'node:tls'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..', '..', '..')
const rootEnvPath = join(__dirname, '..', '..', '..', '.env')

function loadRootEnv() {
  if (!existsSync(rootEnvPath)) return

  const lines = readFileSync(rootEnvPath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadRootEnv()

const port = Number(process.env.PORT || 4201)
const serviceName = process.env.SERVICE_NAME || 'auth-service'
const resendApiKey = process.env.RESEND_API_KEY || ''
const emailProvider = process.env.EMAIL_PROVIDER || 'console'
const smtpHost = process.env.SMTP_HOST || ''
const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpUser = process.env.SMTP_USER || ''
const smtpPass = process.env.SMTP_PASS || ''
const emailFrom = process.env.EMAIL_FROM || 'Viajei <onboarding@resend.dev>'
const validationServiceUrl = process.env.VALIDATION_SERVICE_URL || 'http://localhost:4205'
const configuredDatabasePath = process.env.SQLITE_DATABASE_PATH || './hoteis.db'
const databasePath = resolve(projectRoot, configuredDatabasePath)
const schemaPath = join(__dirname, '..', '..', '..', 'infra', 'database', 'schema.sql')
const seedPath = join(__dirname, '..', '..', '..', 'infra', 'database', 'seed-hotels.sql')
const db = new DatabaseSync(databasePath)
const externalRequestTimeoutMs = Number(process.env.EXTERNAL_REQUEST_TIMEOUT_MS || 5000)
const smtpTimeoutMs = Number(process.env.SMTP_TIMEOUT_MS || 15000)

db.exec('PRAGMA foreign_keys = ON;')
if (existsSync(schemaPath)) {
  db.exec(readFileSync(schemaPath, 'utf8'))
}
if (existsSync(seedPath)) {
  db.exec(readFileSync(seedPath, 'utf8'))
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-user-id',
  })
  res.end(JSON.stringify(payload))
}

function timeoutSignal(ms = externalRequestTimeoutMs) {
  return AbortSignal.timeout(ms)
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function hashCode(code) {
  return createHash('sha256').update(code).digest('hex')
}

function hashPassword(password) {
  return createHash('sha256').update(`hotel-sistema:${password}`).digest('hex')
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    email_verified_at: row.email_verified_at,
  }
}

function findUserByEmail(email) {
  return db
    .prepare(
      `SELECT
         id,
         nome AS name,
         email,
         email_verificado_em AS email_verified_at,
         avatar_url,
         senha_hash AS password_hash,
         telefone AS phone,
         documento AS document,
         criado_em AS created_at,
         atualizado_em AS updated_at
       FROM usuarios
       WHERE email = ?`
    )
    .get(email)
}

function findUserById(id) {
  return db
    .prepare(
      `SELECT
         id,
         nome AS name,
         email,
         email_verificado_em AS email_verified_at,
         avatar_url,
         senha_hash AS password_hash,
         telefone AS phone,
         documento AS document,
         criado_em AS created_at,
         atualizado_em AS updated_at
       FROM usuarios
       WHERE id = ?`
    )
    .get(id)
}

async function validateRegistrationData(payload) {
  let response

  try {
    response = await fetch(`${validationServiceUrl}/validate/reservation-guest`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        cpf: payload.document,
        cep: payload.zipCode,
        birthdate: payload.birthdate,
        minimumAge: 18,
      }),
      signal: timeoutSignal(),
    })
  } catch (error) {
    return {
      valid: false,
      status: 502,
      payload: {
        error: 'validation_service_unavailable',
        message: error instanceof Error && error.name === 'TimeoutError'
          ? 'Servico Python de validacao demorou para responder.'
          : 'Servico Python de validacao indisponivel.',
      },
    }
  }

  const body = await response.json().catch(() => ({}))

  if (!response.ok || body.valid === false) {
    return {
      valid: false,
      status: 422,
      payload: {
        error: 'invalid_register_data',
        message: 'Revise os dados do cadastro.',
        details: body.errors || [],
      },
    }
  }

  return { valid: true, normalized: body.normalized || {} }
}

async function startPendingPasswordRegister(payload) {
  const email = String(payload.email || '').trim().toLowerCase()
  const name = String(payload.name || '').trim()
  const password = String(payload.password || '')

  if (!name || !email || password.length < 8) {
    return { status: 400, payload: { error: 'invalid_register_data', message: 'Informe nome, e-mail e senha com pelo menos 8 caracteres.' } }
  }

  const validation = await validateRegistrationData({ ...payload, email, name })
  if (!validation.valid) {
    return { status: validation.status, payload: validation.payload }
  }

  const existing = findUserByEmail(email)
  if (existing?.password_hash) {
    return { status: 409, payload: { error: 'email_already_registered', message: 'Este e-mail ja possui senha cadastrada.' } }
  }

  const pendingId = randomUUID()
  const code = String(randomInt(100000, 999999))
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()
  const normalizedPhone = validation.normalized.phone || null
  const normalizedDocument = validation.normalized.cpf || null

  db.prepare('DELETE FROM cadastros_pendentes WHERE email = ?').run(email)
  db.prepare(
    `INSERT INTO cadastros_pendentes
       (id, nome, email, senha_hash, telefone, documento, codigo_hash, expira_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(pendingId, name, email, hashPassword(password), normalizedPhone, normalizedDocument, hashCode(code), expiresAt)

  try {
    const delivery = await sendVerificationEmail(email, code)
    return {
      status: 202,
      payload: {
        data: {
          pendingRegistrationId: pendingId,
          email,
          expiresAt,
          delivery,
          requiresEmailVerification: true,
        },
      },
    }
  } catch (error) {
    db.prepare('DELETE FROM cadastros_pendentes WHERE id = ?').run(pendingId)
    return {
      status: 502,
      payload: {
        error: 'email_delivery_failed',
        message: error instanceof Error ? error.message : 'Nao foi possivel enviar o codigo por e-mail.',
      },
    }
  }
}

function confirmPendingPasswordRegister(payload) {
  const email = String(payload.email || '').trim().toLowerCase()
  const code = String(payload.code || '').trim()
  const codeHash = hashCode(code)
  const pending = db.prepare(
    `SELECT *
     FROM cadastros_pendentes
     WHERE email = ? AND codigo_hash = ?
     LIMIT 1`
  ).get(email, codeHash)

  if (!pending || new Date(pending.expira_em).getTime() < Date.now()) {
    if (email) {
      db.prepare('UPDATE cadastros_pendentes SET tentativas = tentativas + 1 WHERE email = ?').run(email)
    }

    return {
      status: 400,
      payload: { error: 'invalid_or_expired_code', message: 'Codigo invalido ou expirado.' },
    }
  }

  const existing = findUserByEmail(email)
  if (existing?.password_hash) {
    db.prepare('DELETE FROM cadastros_pendentes WHERE id = ?').run(pending.id)
    return { status: 409, payload: { error: 'email_already_registered', message: 'Este e-mail ja possui senha cadastrada.' } }
  }

  const userId = existing?.id || randomUUID()

  if (existing) {
    db.prepare(
      `UPDATE usuarios
       SET nome = ?, senha_hash = ?, telefone = ?, documento = ?, email_verificado_em = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(pending.nome, pending.senha_hash, pending.telefone, pending.documento, userId)
  } else {
    db.prepare(
      `INSERT INTO usuarios (id, nome, email, email_verificado_em, senha_hash, telefone, documento)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`
    ).run(userId, pending.nome, pending.email, pending.senha_hash, pending.telefone, pending.documento)
  }

  db.prepare('DELETE FROM cadastros_pendentes WHERE id = ?').run(pending.id)
  activateWallet(userId)
  return { status: 201, payload: { data: { user: publicUser(findUserById(userId)), walletBonusCents: 2000000 } } }
}

function loginWithPassword(payload) {
  const email = String(payload.email || '').trim().toLowerCase()
  const password = String(payload.password || '')
  const user = findUserByEmail(email)

  if (!user?.password_hash || user.password_hash !== hashPassword(password)) {
    return { status: 401, payload: { error: 'invalid_credentials', message: 'E-mail ou senha invalidos.' } }
  }

  if (!user.email_verified_at) {
    return {
      status: 403,
      payload: {
        error: 'email_not_verified',
        message: 'Confirme o codigo enviado no cadastro antes de entrar.',
      },
    }
  }

  return { status: 200, user }
}

function activateWallet(userId) {
  db.prepare('INSERT OR IGNORE INTO carteiras (usuario_id, saldo_centavos) VALUES (?, 2000000)').run(userId)
}

async function createEmailVerification(user, reason = 'login') {
  const code = String(randomInt(100000, 999999))
  const id = randomUUID()
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()

  db.prepare(
    `INSERT INTO verificacoes_email (id, usuario_id, email, codigo_hash, expira_em)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, user.id, user.email, hashCode(code), expiresAt)

  const delivery = await sendVerificationEmail(user.email, code)
  return { verificationId: id, email: user.email, expiresAt, delivery, reason }
}

function parseEmailAddress(value) {
  const match = String(value || '').match(/<([^>]+)>/)
  return (match ? match[1] : value).trim()
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function createEmailHtml(code) {
  return `
    <h2>Codigo de verificacao</h2>
    <p>Use o codigo abaixo para confirmar seu login no Viajei:</p>
    <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${escapeHtml(code)}</p>
    <p>Este codigo expira em 10 minutos.</p>
  `
}

function createEmailText(code) {
  return `Codigo de verificacao do Viajei: ${code}\n\nEste codigo expira em 10 minutos.`
}

function readSmtpReply(socket) {
  return new Promise((resolve, reject) => {
    let buffer = ''

    const onData = (chunk) => {
      buffer += chunk.toString('utf8')
      const lines = buffer.split(/\r?\n/).filter(Boolean)
      const lastLine = lines.at(-1)

      if (lastLine && /^\d{3}\s/.test(lastLine)) {
        cleanup()
        resolve({ code: Number(lastLine.slice(0, 3)), message: buffer })
      }
    }

    const onError = (error) => {
      cleanup()
      reject(error)
    }

    const cleanup = () => {
      socket.off('data', onData)
      socket.off('error', onError)
    }

    socket.on('data', onData)
    socket.on('error', onError)
  })
}

async function sendSmtpCommand(socket, command, expectedCodes = []) {
  socket.write(`${command}\r\n`)
  const reply = await readSmtpReply(socket)

  if (expectedCodes.length > 0 && !expectedCodes.includes(reply.code)) {
    throw new Error(`SMTP respondeu ${reply.code}: ${reply.message}`)
  }

  return reply
}

function connectSmtpSocket() {
  return new Promise((resolve, reject) => {
    const socket = smtpPort === 465
      ? tls.connect({ host: smtpHost, port: smtpPort, servername: smtpHost })
      : net.connect({ host: smtpHost, port: smtpPort })

    socket.once('error', reject)
    socket.once('connect', () => {
      socket.off('error', reject)
      resolve(socket)
    })
  })
}

async function upgradeToTls(socket) {
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({
      socket,
      host: smtpHost,
      servername: smtpHost,
    })

    secureSocket.once('error', reject)
    secureSocket.once('secureConnect', () => {
      secureSocket.off('error', reject)
      resolve(secureSocket)
    })
  })
}

async function sendEmailWithSmtp(email, code) {
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP_HOST, SMTP_USER e SMTP_PASS precisam estar configurados.')
  }

  let socket = await Promise.race([
    connectSmtpSocket(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP demorou para conectar. Verifique host, porta, senha de app e se sua rede permite SMTP.')), smtpTimeoutMs)),
  ])

  try {
    await readSmtpReply(socket)
    await sendSmtpCommand(socket, `EHLO localhost`, [250])

    if (smtpPort !== 465) {
      await sendSmtpCommand(socket, 'STARTTLS', [220])
      socket = await upgradeToTls(socket)
      await sendSmtpCommand(socket, `EHLO localhost`, [250])
    }

    await sendSmtpCommand(socket, 'AUTH LOGIN', [334])
    await sendSmtpCommand(socket, Buffer.from(smtpUser).toString('base64'), [334])
    await sendSmtpCommand(socket, Buffer.from(smtpPass).toString('base64'), [235])

    const fromAddress = parseEmailAddress(emailFrom)
    await sendSmtpCommand(socket, `MAIL FROM:<${fromAddress}>`, [250])
    await sendSmtpCommand(socket, `RCPT TO:<${email}>`, [250, 251])
    await sendSmtpCommand(socket, 'DATA', [354])

    const subject = 'Codigo de verificacao do Viajei'
    const text = createEmailText(code)
    const html = createEmailHtml(code)
    const message = [
      `From: ${emailFrom}`,
      `To: ${email}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary="hotel-sistema-code"',
      '',
      '--hotel-sistema-code',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      text,
      '',
      '--hotel-sistema-code',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      html,
      '',
      '--hotel-sistema-code--',
      '.',
      '',
    ].join('\r\n')

    await sendSmtpCommand(socket, message, [250])
    await sendSmtpCommand(socket, 'QUIT', [221])
    return { provider: 'smtp', delivered: true }
  } finally {
    socket.destroy()
  }
}

async function sendVerificationEmail(email, code) {
  if (smtpHost && smtpUser && smtpPass) {
    return sendEmailWithSmtp(email, code)
  }

  if (emailProvider !== 'resend' || !resendApiKey) {
    console.log(JSON.stringify({ service: serviceName, event: 'email_code_console_fallback', email, code }))
    return { provider: 'console', delivered: false }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: email,
      subject: 'Codigo de verificacao do Viajei',
      html: createEmailHtml(code),
    }),
    signal: timeoutSignal(),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Falha ao enviar e-mail: ${body}`)
  }

  return { provider: 'resend', delivered: true }
}

const server = createServer(async (req, res) => {
  // Servico de autenticacao: concentra cadastro, login por senha,
  // verificacao por codigo enviado ao e-mail e liberacao da carteira demo.
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok', service: serviceName, port, databasePath, mode: 'demo' })
    return
  }

  if (req.method === 'POST' && url.pathname === '/password/register') {
    const result = await startPendingPasswordRegister(await readJson(req))
    sendJson(res, result.status, result.payload)
    return
  }

  if (req.method === 'POST' && url.pathname === '/password/register/confirm') {
    const result = confirmPendingPasswordRegister(await readJson(req))
    sendJson(res, result.status, result.payload)
    return
  }

  if (req.method === 'POST' && url.pathname === '/password/login') {
    const result = loginWithPassword(await readJson(req))

    if (result.status !== 200) {
      sendJson(res, result.status, result.payload)
      return
    }

    activateWallet(result.user.id)
    sendJson(res, 200, { data: { user: publicUser(result.user), walletBonusCents: 2000000 } })
    return
  }

  if (req.method === 'POST' && url.pathname === '/email/verify-code') {
    const body = await readJson(req)
    const codeHash = hashCode(body.code)
    const record = db.prepare(
      `SELECT *
       FROM verificacoes_email
       WHERE email = ? AND codigo_hash = ? AND consumido_em IS NULL
       ORDER BY criado_em DESC
       LIMIT 1`
    ).get(body.email, codeHash)

    if (!record || new Date(record.expira_em).getTime() < Date.now()) {
      sendJson(res, 400, { error: 'invalid_or_expired_code' })
      return
    }

    db.prepare('UPDATE verificacoes_email SET consumido_em = CURRENT_TIMESTAMP WHERE id = ?').run(record.id)
    db.prepare('UPDATE usuarios SET email_verificado_em = CURRENT_TIMESTAMP WHERE id = ?').run(record.usuario_id)
    activateWallet(record.usuario_id)
    const user = findUserById(record.usuario_id)
    sendJson(res, 200, { data: { verified: true, user: publicUser(user), walletBonusCents: 2000000 } })
    return
  }

  sendJson(res, 404, { error: 'not_found' })
})

server.listen(port, () => {
  console.log(`${serviceName} listening on http://localhost:${port}`)
  console.log(JSON.stringify({
    service: serviceName,
    event: 'auth_config',
    emailProvider: smtpHost && smtpUser && smtpPass ? 'smtp' : emailProvider === 'resend' && resendApiKey ? 'resend' : 'console',
    smtpConfigured: Boolean(smtpHost && smtpUser && smtpPass),
  }))
})
