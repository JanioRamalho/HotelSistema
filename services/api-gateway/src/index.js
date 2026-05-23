import { createServer } from 'node:http'

const port = Number(process.env.PORT || 4100)
const hotelServiceUrls = (process.env.HOTEL_SERVICE_URLS || 'http://localhost:4101')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)

let hotelServiceIndex = 0

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': process.env.CORS_ORIGIN || '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  })
  res.end(JSON.stringify(payload))
}

function getNextHotelServiceUrl() {
  const selected = hotelServiceUrls[hotelServiceIndex % hotelServiceUrls.length]
  hotelServiceIndex += 1
  return selected
}

async function proxyJson(req, res, targetUrl) {
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        accept: req.headers.accept || 'application/json',
        authorization: req.headers.authorization || '',
      },
    })

    const body = await response.text()
    res.writeHead(response.status, {
      'content-type': response.headers.get('content-type') || 'application/json; charset=utf-8',
      'access-control-allow-origin': process.env.CORS_ORIGIN || '*',
      'x-upstream-service': targetUrl.origin,
    })
    res.end(body)
  } catch (error) {
    sendJson(res, 502, {
      error: 'upstream_unavailable',
      message: error instanceof Error ? error.message : 'Unknown upstream error',
    })
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (url.pathname === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'api-gateway',
      upstreams: {
        hotelService: hotelServiceUrls,
      },
    })
    return
  }

  if (url.pathname === '/api/auth/google') {
    sendJson(res, 501, {
      error: 'not_implemented',
      message: 'Google OAuth will live behind the auth-service in the next phase.',
    })
    return
  }

  if (url.pathname.startsWith('/api/hotels')) {
    const upstream = new URL(getNextHotelServiceUrl())
    const path = url.pathname.replace('/api', '')
    const targetUrl = new URL(`${upstream.origin}${path}${url.search}`)
    await proxyJson(req, res, targetUrl)
    return
  }

  if (url.pathname === '/api/cities' || url.pathname === '/api/states') {
    const upstream = new URL(getNextHotelServiceUrl())
    const targetUrl = new URL(`${upstream.origin}${url.pathname.replace('/api', '')}${url.search}`)
    await proxyJson(req, res, targetUrl)
    return
  }

  sendJson(res, 404, { error: 'route_not_found' })
})

server.listen(port, () => {
  console.log(`api-gateway listening on http://localhost:${port}`)
  console.log(`hotel-service upstreams: ${hotelServiceUrls.join(', ')}`)
})
