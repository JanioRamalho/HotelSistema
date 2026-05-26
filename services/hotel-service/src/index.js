import { createServer } from 'node:http'
import {
  getHotelBySlug,
  getHotelDatabasePath,
  getHotelDataSource,
  getUniqueCities,
  getUniqueStates,
  generateFakeHotels,
  parseHotelFilters,
  searchHotels,
} from './repositories/hotel-repository.js'

const port = Number(process.env.PORT || 4101)
const serviceName = process.env.SERVICE_NAME || 'hotel-service'

function sendJson(res, status, payload) {
  res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization',
  })
  res.end(JSON.stringify(payload))
}

function sendError(res, status, error, message) {
  sendJson(res, status, { error, message })
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }

  const rawBody = Buffer.concat(chunks).toString('utf8').trim()
  return rawBody ? JSON.parse(rawBody) : {}
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok', service: serviceName, port, dataSource: getHotelDataSource(), databasePath: getHotelDatabasePath() })
    return
  }

  try {
    if (req.method === 'POST' && url.pathname === '/hotels/generate') {
      const body = await readJsonBody(req)
      const data = await generateFakeHotels(body)
      sendJson(res, 201, { data, meta: { total: data.length, source: serviceName, dataSource: getHotelDataSource() } })
      return
    }

    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method_not_allowed' })
      return
    }

    if (url.pathname === '/hotels') {
      const data = await searchHotels(parseHotelFilters(url.searchParams))
      sendJson(res, 200, { data, meta: { total: data.length, source: serviceName, dataSource: getHotelDataSource() } })
      return
    }

    if (url.pathname.startsWith('/hotels/')) {
      const slug = decodeURIComponent(url.pathname.replace('/hotels/', ''))
      const hotel = await getHotelBySlug(slug)

      if (!hotel) {
        sendJson(res, 404, { error: 'hotel_not_found' })
        return
      }

      sendJson(res, 200, { data: hotel, meta: { source: serviceName, dataSource: getHotelDataSource() } })
      return
    }

    if (url.pathname === '/cities') {
      const data = await getUniqueCities()
      sendJson(res, 200, { data, meta: { source: serviceName, dataSource: getHotelDataSource() } })
      return
    }

    if (url.pathname === '/states') {
      const data = await getUniqueStates()
      sendJson(res, 200, { data, meta: { source: serviceName, dataSource: getHotelDataSource() } })
      return
    }
  } catch (error) {
    sendError(res, 503, 'database_unavailable', error instanceof Error ? error.message : 'Unknown database error')
    return
  }

  sendJson(res, 404, { error: 'not_found' })
})

server.listen(port, () => {
  console.log(`${serviceName} listening on http://localhost:${port}`)
})
