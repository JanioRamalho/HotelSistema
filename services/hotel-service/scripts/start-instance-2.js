process.env.PORT = process.env.PORT || '4102'
process.env.SERVICE_NAME = process.env.SERVICE_NAME || 'hotel-service-2'

await import('../src/index.js')
