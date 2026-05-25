import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT || 4204)
const serviceName = process.env.SERVICE_NAME || 'geolocation-service'
const databasePath = resolve(process.env.SQLITE_DATABASE_PATH || join(__dirname, '..', '..', '..', 'hoteis.db'))
const schemaPath = join(__dirname, '..', '..', '..', 'infra', 'database', 'schema.sql')
const seedPath = join(__dirname, '..', '..', '..', 'infra', 'database', 'seed-hotels.sql')
const db = new DatabaseSync(databasePath)

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
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  })
  res.end(JSON.stringify(payload))
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok', service: serviceName, port, databasePath })
    return
  }

  if (req.method === 'GET' && url.pathname.startsWith('/hotel/')) {
    const slug = decodeURIComponent(url.pathname.replace('/hotel/', ''))
    const hotel = db.prepare(
      `SELECT
         id,
         nome AS name,
         slug,
         endereco AS address,
         cidade AS city,
         estado AS state,
         pais AS country,
         latitude,
         longitude
       FROM hoteis
       WHERE slug = ?`
    ).get(slug)

    if (!hotel) {
      sendJson(res, 404, { error: 'hotel_not_found' })
      return
    }

    sendJson(res, 200, { data: hotel })
    return
  }

  sendJson(res, 404, { error: 'not_found' })
})

server.listen(port, () => {
  console.log(`${serviceName} listening on http://localhost:${port}`)
})
