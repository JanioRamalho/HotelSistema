process.env.PORT = process.env.PORT || '4101'
process.env.SERVICE_NAME = process.env.SERVICE_NAME || 'hotel-service-1'

await import('../src/index.js')
