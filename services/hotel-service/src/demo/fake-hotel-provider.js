import { randomUUID } from 'node:crypto'

const cityCatalog = [
  { city: 'Rio de Janeiro', state: 'RJ', lat: -22.9068, lng: -43.1729, zip: '22000-000' },
  { city: 'Sao Paulo', state: 'SP', lat: -23.5505, lng: -46.6333, zip: '01000-000' },
  { city: 'Salvador', state: 'BA', lat: -12.9777, lng: -38.5016, zip: '40000-000' },
  { city: 'Florianopolis', state: 'SC', lat: -27.5949, lng: -48.5482, zip: '88000-000' },
  { city: 'Recife', state: 'PE', lat: -8.0476, lng: -34.877, zip: '50000-000' },
  { city: 'Fortaleza', state: 'CE', lat: -3.7319, lng: -38.5267, zip: '60000-000' },
  { city: 'Gramado', state: 'RS', lat: -29.3737, lng: -50.8764, zip: '95670-000' },
  { city: 'Buzios', state: 'RJ', lat: -22.7528, lng: -41.8846, zip: '28950-000' },
  { city: 'Curitiba', state: 'PR', lat: -25.4284, lng: -49.2733, zip: '80000-000' },
  { city: 'Belo Horizonte', state: 'MG', lat: -19.9167, lng: -43.9345, zip: '30000-000' },
]

const prefixes = ['Grand', 'Solar', 'Villa', 'Mirante', 'Jardim', 'Reserva', 'Blue', 'Imperial', 'Lumiere', 'Serra']
const suffixes = ['Palace', 'Hotel', 'Resort', 'Suites', 'Inn', 'Boutique', 'Residence', 'Lodge']
const amenitiesPool = [
  'wifi',
  'pool',
  'gym',
  'spa',
  'restaurant',
  'bar',
  'room-service',
  'parking',
  'air-conditioning',
  'breakfast',
  'beach-access',
  'kids-club',
  'pet-friendly',
  'concierge',
]

const hotelImages = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
]

const roomImages = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800',
  'https://images.unsplash.com/photo-1598928506311-c55e085d3c76?w=800',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
]

function pick(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function sample(items, count) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count)
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function chooseLocation({ city, state } = {}) {
  const matches = cityCatalog.filter((item) => {
    if (city && item.city.toLowerCase() !== String(city).toLowerCase()) return false
    if (state && item.state !== state) return false
    return true
  })

  return pick(matches.length > 0 ? matches : cityCatalog)
}

function buildRooms(hotelId, basePrice, stars) {
  return [
    {
      id: `${hotelId}-std`,
      name: 'Quarto Standard',
      description: 'Quarto confortavel com cama casal, ar-condicionado e banheiro privativo.',
      category: 'standard',
      price: basePrice,
      capacity: 2,
      size: 28,
      amenities: ['wifi', 'air-conditioning', 'room-service'],
      images: [roomImages[0]],
    },
    {
      id: `${hotelId}-lux`,
      name: stars >= 5 ? 'Suite Master' : 'Quarto Superior',
      description: 'Acomodacao ampla com area de estar, enxoval premium e vista privilegiada.',
      category: stars >= 5 ? 'luxury' : 'standard',
      price: Math.round(basePrice * 1.45),
      capacity: stars >= 5 ? 4 : 3,
      size: stars >= 5 ? 48 : 34,
      amenities: ['wifi', 'air-conditioning', 'room-service', 'breakfast'],
      images: [roomImages[1]],
    },
  ]
}

export function fetchFakeHotels({ count = 5, city, state } = {}) {
  return Array.from({ length: count }, () => {
    const id = `auto-${randomUUID()}`
    const location = chooseLocation({ city, state })
    const stars = Math.floor(Math.random() * 3) + 3
    const basePrice = stars === 5 ? 850 + Math.floor(Math.random() * 900) : 260 + Math.floor(Math.random() * 520)
    const name = `${pick(prefixes)} ${pick(suffixes)} ${location.city}`
    const slug = `${slugify(name)}-${id.slice(5, 13)}`
    const rating = Number((4.2 + Math.random() * 0.7).toFixed(1))
    const amenities = sample(amenitiesPool, stars >= 5 ? 9 : 6)

    return {
      id,
      name,
      slug,
      description: `${name} e uma hospedagem gerada automaticamente para demonstracao, com quartos reservaveis e estrutura completa em ${location.city}.`,
      shortDescription: `Hospedagem automatica em ${location.city}`,
      address: `Av. Principal, ${Math.floor(Math.random() * 900) + 100}`,
      city: location.city,
      state: location.state,
      country: 'Brasil',
      zipCode: location.zip,
      latitude: Number((location.lat + (Math.random() - 0.5) * 0.08).toFixed(6)),
      longitude: Number((location.lng + (Math.random() - 0.5) * 0.08).toFixed(6)),
      stars,
      rating,
      reviewCount: Math.floor(Math.random() * 900) + 80,
      priceFrom: basePrice,
      policies: {
        checkIn: '14:00',
        checkOut: '12:00',
        cancellation: 'Cancelamento gratuito ate 48h antes do check-in',
        pets: amenities.includes('pet-friendly') ? 'Aceitamos pets de pequeno porte' : 'Consulte a politica de pets com o hotel',
        children: 'Criancas de todas as idades sao bem-vindas',
      },
      contact: {
        phone: `(${Math.floor(Math.random() * 80) + 11}) 4000-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        email: `reservas@${slug}.local`,
        website: `${slug}.local`,
      },
      images: [
        { id: `${id}-hotel-img-1`, url: pick(hotelImages), alt: `Fachada do ${name}`, category: 'exterior', order: 1 },
        { id: `${id}-hotel-img-2`, url: pick(hotelImages), alt: `Area comum do ${name}`, category: 'common', order: 2 },
      ],
      amenities,
      rooms: buildRooms(id, basePrice, stars),
      reviews: [
        {
          id: `${id}-review-1`,
          userName: 'Hospede verificado',
          rating: Math.round(rating),
          comment: 'Hospedagem excelente, equipe atenciosa e localizacao muito boa.',
          date: '2026-04-12',
          stayDate: '2026-04-06',
        },
      ],
    }
  })
}
