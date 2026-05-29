const { spawn } = require('node:child_process')
const net = require('node:net')

const commands = [
  { name: 'hotel-service-1', command: 'npm', args: ['run', 'dev:hotel-service:1'], port: 4101 },
  { name: 'auth-service', command: 'npm', args: ['run', 'dev:auth-service'], port: 4201 },
  { name: 'booking-service', command: 'npm', args: ['run', 'dev:booking-service'], port: 4202 },
  { name: 'geolocation-service', command: 'npm', args: ['run', 'dev:geolocation-service'], port: 4204 },
  { name: 'validation-service', command: 'npm', args: ['run', 'dev:validation-service'], port: 4205 },
  { name: 'api-gateway', command: 'npm', args: ['run', 'dev:gateway'], port: 4100 },
  { name: 'frontend', command: 'npm', args: ['run', 'dev'], port: 3000 },
]

const children = []
let failed = false

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  }

  process.exit(code)
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port })

    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })

    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })

    socket.setTimeout(250, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForPort(port, timeoutMs = 15000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (await isPortOpen(port)) {
      return true
    }

    await wait(300)
  }

  return false
}

async function startCommand(command) {
  if (command.port && (await isPortOpen(command.port))) {
    console.log(`[dev:all] ${command.name} já está rodando na porta ${command.port}; ignorando.`)
    return
  }

  const child = spawn(command.command, command.args, {
    stdio: 'inherit',
    shell: true,
  })

  children.push(child)

  if (command.port) {
    const isReady = await waitForPort(command.port)

    if (!isReady) {
      console.error(`[dev:all] ${command.name} não ficou pronto na porta ${command.port}`)
      child.kill('SIGTERM')
      shutdown(1)
    }
  }

  child.on('exit', (code, signal) => {
    if (code !== 0 && !failed) {
      failed = true
      console.error(`[dev:all] ${command.name} encerrado com código ${code || signal}`)
      shutdown(1)
    }
  })
}

async function main() {
  for (const command of commands) {
    await startCommand(command)
  }
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

main().catch((error) => {
  console.error(error)
  shutdown(1)
})
