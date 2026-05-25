import { createServer } from 'node:http'
import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { extname, join } from 'node:path'

const port = Number(process.env.PORT || 4203)
const serviceName = process.env.SERVICE_NAME || 'media-service'
const uploadDir = process.env.MEDIA_UPLOAD_DIR || join(process.cwd(), 'uploads')

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-file-name',
  })
  res.end(JSON.stringify(payload))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok', service: serviceName, port, uploadDir, storageMode: 'local-s3-simulation' })
    return
  }

  if (req.method === 'POST' && url.pathname === '/upload') {
    const originalName = req.headers['x-file-name']?.toString() || 'upload.bin'
    const extension = extname(originalName) || '.bin'
    const fileName = `${randomUUID()}${extension}`
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, fileName), await readBody(req))

    sendJson(res, 201, {
      data: {
        fileName,
        url: `/uploads/${fileName}`,
        storageMode: 'local-s3-simulation',
      },
    })
    return
  }

  sendJson(res, 404, { error: 'not_found' })
})

server.listen(port, () => {
  console.log(`${serviceName} listening on http://localhost:${port}`)
})
