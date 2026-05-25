import { createServer } from 'node:http'

const port = Number(process.env.PORT || 4100)
const corsOrigin = process.env.CORS_ORIGIN || '*'
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000)
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 100)
const upstreamTimeoutMs = Number(process.env.UPSTREAM_TIMEOUT_MS || 15_000)

const upstreams = {
  hotelService: parseUrls(process.env.HOTEL_SERVICE_URLS || 'http://localhost:4101,http://localhost:4102'),
  authService: parseUrls(process.env.AUTH_SERVICE_URLS || 'http://localhost:4201'),
  bookingService: parseUrls(process.env.BOOKING_SERVICE_URLS || 'http://localhost:4202'),
  mediaService: parseUrls(process.env.MEDIA_SERVICE_URLS || 'http://localhost:4203'),
  geolocationService: parseUrls(process.env.GEOLOCATION_SERVICE_URLS || 'http://localhost:4204'),
  validationService: parseUrls(process.env.VALIDATION_SERVICE_URLS || 'http://localhost:4205'),
}

const upstreamIndexes = new Map()
const rateLimitBuckets = new Map()
const metrics = {
  startedAt: new Date().toISOString(),
  totalRequests: 0,
  rateLimitedRequests: 0,
  requestsByRoute: {},
  upstreams: {},
}

function parseUrls(value) {
  return value
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': corsOrigin,
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-user-id',
    ...extraHeaders,
  })
  res.end(JSON.stringify(payload))
}

function logEvent(event) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    ...event,
  }))
}

function routeKey(pathname) {
  if (pathname.startsWith('/api/hotels/')) return '/api/hotels/:slug'
  if (pathname.startsWith('/api/hotels')) return '/api/hotels'
  if (pathname.startsWith('/api/auth')) return '/api/auth/*'
  if (pathname.startsWith('/api/bookings')) return '/api/bookings/*'
  if (pathname.startsWith('/api/media')) return '/api/media/*'
  if (pathname.startsWith('/api/geolocation')) return '/api/geolocation/*'
  if (pathname.startsWith('/api/validation')) return '/api/validation/*'
  return pathname
}

function incrementMetric(pathname) {
  metrics.totalRequests += 1
  const key = routeKey(pathname)
  metrics.requestsByRoute[key] = (metrics.requestsByRoute[key] || 0) + 1
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }

  return req.socket.remoteAddress || 'unknown'
}

function isRateLimited(req) {
  const ip = clientIp(req)
  const now = Date.now()
  const bucket = rateLimitBuckets.get(ip)

  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + rateLimitWindowMs })
    return false
  }

  bucket.count += 1
  return bucket.count > rateLimitMax
}

function getNextUpstream(serviceName) {
  const urls = upstreams[serviceName] || []
  if (urls.length === 0) return undefined

  const current = upstreamIndexes.get(serviceName) || 0
  const selected = urls[current % urls.length]
  upstreamIndexes.set(serviceName, current + 1)
  return selected
}

function recordUpstream(origin, status, durationMs) {
  if (!metrics.upstreams[origin]) {
    metrics.upstreams[origin] = {
      requests: 0,
      errors: 0,
      totalDurationMs: 0,
      lastStatus: null,
    }
  }

  const item = metrics.upstreams[origin]
  item.requests += 1
  item.totalDurationMs += durationMs
  item.lastStatus = status

  if (status >= 500) {
    item.errors += 1
  }
}

async function readRequestBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function fetchUpstream(req, targetUrl, body) {
  return fetch(targetUrl, {
    method: req.method,
    headers: {
      accept: req.headers.accept || 'application/json',
      authorization: req.headers.authorization || '',
      'x-user-id': req.headers['x-user-id'] || '',
      'content-type': req.headers['content-type'] || 'application/json',
    },
    body,
    signal: AbortSignal.timeout(upstreamTimeoutMs),
  })
}

async function proxyJson(req, res, serviceName, path, search) {
  const serviceUpstreams = upstreams[serviceName] || []
  const firstUpstream = getNextUpstream(serviceName)

  if (!firstUpstream) {
    sendJson(res, 502, { error: 'upstream_not_configured', service: serviceName })
    return
  }

  const upstreamQueue = [
    firstUpstream,
    ...serviceUpstreams.filter((url) => url !== firstUpstream),
  ]
  const startedAt = Date.now()
  const body = ['GET', 'HEAD'].includes(req.method || '') ? undefined : await readRequestBody(req)
  let lastError

  for (const upstream of upstreamQueue) {
    const targetUrl = new URL(`${new URL(upstream).origin}${path}${search}`)

    try {
      const response = await fetchUpstream(req, targetUrl, body)
      const responseBody = await response.text()
      const durationMs = Date.now() - startedAt
      recordUpstream(targetUrl.origin, response.status, durationMs)
      logEvent({
        event: 'proxy',
        method: req.method,
        path,
        status: response.status,
        durationMs,
        upstream: targetUrl.origin,
      })

      res.writeHead(response.status, {
        'content-type': response.headers.get('content-type') || 'application/json; charset=utf-8',
        'access-control-allow-origin': corsOrigin,
        'x-upstream-service': targetUrl.origin,
      })
      res.end(responseBody)
      return
    } catch (error) {
      lastError = error
      const durationMs = Date.now() - startedAt
      recordUpstream(targetUrl.origin, 502, durationMs)
      logEvent({
        event: 'proxy_error',
        method: req.method,
        path,
        status: 502,
        durationMs,
        upstream: targetUrl.origin,
        error: error instanceof Error ? error.message : 'Unknown upstream error',
      })
    }
  }

  sendJson(res, 502, {
    error: 'upstream_unavailable',
    message: lastError instanceof Error ? lastError.message : 'Todos os upstreams estao indisponiveis.',
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  incrementMetric(url.pathname)

  if (url.pathname !== '/health' && url.pathname !== '/metrics' && isRateLimited(req)) {
    metrics.rateLimitedRequests += 1
    logEvent({ event: 'rate_limited', method: req.method, path: url.pathname, ip: clientIp(req), status: 429 })
    sendJson(res, 429, {
      error: 'rate_limit_exceeded',
      message: 'Muitas requisicoes. Tente novamente em alguns segundos.',
    })
    return
  }

  if (url.pathname === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'api-gateway',
      rateLimit: {
        windowMs: rateLimitWindowMs,
        max: rateLimitMax,
      },
      upstreamTimeoutMs,
      upstreams,
    })
    return
  }

  if (url.pathname === '/metrics') {
    const upstreamMetrics = Object.fromEntries(
      Object.entries(metrics.upstreams).map(([key, value]) => [
        key,
        {
          ...value,
          averageDurationMs: value.requests > 0 ? Math.round(value.totalDurationMs / value.requests) : 0,
        },
      ])
    )

    sendJson(res, 200, { ...metrics, upstreams: upstreamMetrics })
    return
  }

  if (url.pathname.startsWith('/api/hotels')) {
    await proxyJson(req, res, 'hotelService', url.pathname.replace('/api', ''), url.search)
    return
  }

  if (url.pathname === '/api/cities' || url.pathname === '/api/states') {
    await proxyJson(req, res, 'hotelService', url.pathname.replace('/api', ''), url.search)
    return
  }

  if (url.pathname.startsWith('/api/auth')) {
    await proxyJson(req, res, 'authService', url.pathname.replace('/api/auth', ''), url.search)
    return
  }

  if (url.pathname.startsWith('/api/bookings') || url.pathname.startsWith('/api/wallet')) {
    await proxyJson(req, res, 'bookingService', url.pathname.replace('/api', ''), url.search)
    return
  }

  if (url.pathname.startsWith('/api/media')) {
    await proxyJson(req, res, 'mediaService', url.pathname.replace('/api/media', ''), url.search)
    return
  }

  if (url.pathname.startsWith('/api/geolocation')) {
    await proxyJson(req, res, 'geolocationService', url.pathname.replace('/api/geolocation', ''), url.search)
    return
  }

  if (url.pathname.startsWith('/api/validation')) {
    await proxyJson(req, res, 'validationService', url.pathname.replace('/api/validation', ''), url.search)
    return
  }

  sendJson(res, 404, { error: 'route_not_found' })
})

server.listen(port, () => {
  console.log(`api-gateway listening on http://localhost:${port}`)
  console.log(`hotel-service upstreams: ${upstreams.hotelService.join(', ')}`)
})
