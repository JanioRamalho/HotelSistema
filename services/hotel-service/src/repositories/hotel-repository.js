import { getSQLiteDatabasePath, getSQLite, initializeSQLiteDatabase, querySQLite } from '../database/sqlite-client.js'
import { dummyHotels } from '../data/dummy-hotels.js'

initializeSQLiteDatabase()

export function getHotelDataSource() {
  return 'sqlite-local+dummy-api'
}

export function getHotelDatabasePath() {
  return getSQLiteDatabasePath()
}

function toNumber(value) {
  if (value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toList(value) {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function mapHotelRow(row) {
  return {
    id: row.id,
    name: row.nome,
    slug: row.slug,
    description: row.descricao,
    shortDescription: row.descricao_curta,
    address: row.endereco,
    city: row.cidade,
    state: row.estado,
    country: row.pais,
    zipCode: row.cep,
    latitude: row.latitude,
    longitude: row.longitude,
    stars: row.estrelas,
    rating: row.nota,
    reviewCount: row.quantidade_avaliacoes,
    priceFrom: row.preco_inicial,
    images: [],
    amenities: [],
    rooms: [],
    reviews: [],
    policies: {
      checkIn: row.politica_check_in,
      checkOut: row.politica_check_out,
      cancellation: row.politica_cancelamento,
      pets: row.politica_pets,
      children: row.politica_criancas,
    },
    contact: {
      phone: row.contato_telefone,
      email: row.contato_email,
      ...(row.contato_site ? { website: row.contato_site } : {}),
    },
  }
}

async function hydrateHotels(hotelRows) {
  const hotels = hotelRows.map(mapHotelRow)

  hotels.forEach((hotel) => {
    const images = querySQLite(
      `SELECT url, texto_alternativo, categoria
       FROM imagens_hotel
       WHERE hotel_id = ?
       ORDER BY ordem, id`,
      [hotel.id]
    )
    const amenities = querySQLite(
      `SELECT comodidade_id
       FROM hoteis_comodidades
       WHERE hotel_id = ?
       ORDER BY comodidade_id`,
      [hotel.id]
    )
    const rooms = querySQLite(
      `SELECT id, nome, descricao, categoria, preco, capacidade, tamanho, disponivel
       FROM quartos
       WHERE hotel_id = ?
       ORDER BY preco, id`,
      [hotel.id]
    )
    const reviews = querySQLite(
      `SELECT id, COALESCE(usuario_id, '') AS usuario_id, nome_usuario, avatar_usuario, nota, comentario, data_avaliacao, data_hospedagem
       FROM avaliacoes
       WHERE hotel_id = ?
       ORDER BY data_avaliacao DESC, id`,
      [hotel.id]
    )

    hotel.images = images.map((image) => ({
      url: image.url,
      alt: image.texto_alternativo,
      category: image.categoria,
    }))
    hotel.amenities = amenities.map((amenity) => amenity.comodidade_id)
    hotel.reviews = reviews.map((review) => ({
      id: review.id,
      userId: review.usuario_id,
      userName: review.nome_usuario,
      ...(review.avatar_usuario ? { userAvatar: review.avatar_usuario } : {}),
      rating: review.nota,
      comment: review.comentario,
      date: review.data_avaliacao,
      stayDate: review.data_hospedagem,
    }))
    hotel.rooms = rooms.map((room) => {
      const roomImages = querySQLite(
        `SELECT url
         FROM imagens_quarto
         WHERE quarto_id = ?
         ORDER BY ordem, id`,
        [room.id]
      )
      const roomAmenities = querySQLite(
        `SELECT comodidade_id
         FROM quartos_comodidades
         WHERE quarto_id = ?
         ORDER BY comodidade_id`,
        [room.id]
      )

      return {
        id: room.id,
        name: room.nome,
        description: room.descricao,
        category: room.categoria,
        price: room.preco,
        capacity: room.capacidade,
        size: room.tamanho,
        amenities: roomAmenities.map((amenity) => amenity.comodidade_id),
        images: roomImages.map((image) => image.url),
        available: Boolean(room.disponivel),
      }
    })
  })

  return hotels
}

export function parseHotelFilters(searchParams) {
  return {
    city: searchParams.get('city') || undefined,
    state: searchParams.get('state') || undefined,
    guests: toNumber(searchParams.get('guests')),
    priceMin: toNumber(searchParams.get('priceMin')),
    priceMax: toNumber(searchParams.get('priceMax')),
    minRating: toNumber(searchParams.get('minRating')),
    amenities: toList(searchParams.get('amenities')),
    stars: toList(searchParams.get('stars')).map(Number).filter(Number.isFinite),
  }
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function matchesDummyHotel(hotel, filters) {
  if (filters.city && !normalizeText(hotel.city).includes(normalizeText(filters.city))) return false
  if (filters.state && hotel.state !== filters.state) return false
  if (filters.guests && !hotel.rooms.some((room) => room.capacity >= filters.guests)) return false
  if (filters.priceMin && hotel.priceFrom < filters.priceMin) return false
  if (filters.priceMax && hotel.priceFrom > filters.priceMax) return false
  if (filters.minRating && hotel.rating < filters.minRating) return false
  if (filters.stars.length > 0 && !filters.stars.includes(hotel.stars)) return false
  if (filters.amenities.length > 0 && !filters.amenities.every((amenity) => hotel.amenities.includes(amenity))) return false
  return true
}

function searchDummyHotels(filters) {
  return dummyHotels
    .filter((hotel) => matchesDummyHotel(hotel, filters))
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount || a.name.localeCompare(b.name))
}

function mergeHotels(databaseHotels, fallbackHotels) {
  const seen = new Set(databaseHotels.map((hotel) => hotel.slug))
  return [
    ...databaseHotels,
    ...fallbackHotels.filter((hotel) => !seen.has(hotel.slug)),
  ]
}

export async function searchHotels(filters) {
  const conditions = []
  const params = []

  if (filters.city) {
    conditions.push('LOWER(h.cidade) LIKE LOWER(?)')
    params.push(`%${filters.city}%`)
  }

  if (filters.state) {
    conditions.push('h.estado = ?')
    params.push(filters.state)
  }

  if (filters.guests) {
    conditions.push('EXISTS (SELECT 1 FROM quartos q WHERE q.hotel_id = h.id AND q.capacidade >= ?)')
    params.push(filters.guests)
  }

  if (filters.priceMin) {
    conditions.push('h.preco_inicial >= ?')
    params.push(filters.priceMin)
  }

  if (filters.priceMax) {
    conditions.push('h.preco_inicial <= ?')
    params.push(filters.priceMax)
  }

  if (filters.minRating) {
    conditions.push('h.nota >= ?')
    params.push(filters.minRating)
  }

  if (filters.stars.length > 0) {
    conditions.push(`h.estrelas IN (${filters.stars.map(() => '?').join(', ')})`)
    params.push(...filters.stars)
  }

  filters.amenities.forEach((amenity) => {
    conditions.push('EXISTS (SELECT 1 FROM hoteis_comodidades hc WHERE hc.hotel_id = h.id AND hc.comodidade_id = ?)')
    params.push(amenity)
  })

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = querySQLite(
    `SELECT h.*
     FROM hoteis h
     ${where}
     ORDER BY h.nota DESC, h.quantidade_avaliacoes DESC, h.nome ASC`,
    params
  )

  const databaseHotels = await hydrateHotels(rows)
  return mergeHotels(databaseHotels, searchDummyHotels(filters))
}

export async function getHotelBySlug(slug) {
  const hotel = getSQLite('SELECT * FROM hoteis WHERE slug = ? LIMIT 1', [slug])
  const hotels = await hydrateHotels(hotel ? [hotel] : [])
  return hotels[0] || dummyHotels.find((item) => item.slug === slug)
}

export async function getUniqueCities() {
  const rows = querySQLite('SELECT DISTINCT cidade, estado FROM hoteis ORDER BY cidade, estado')
  const cities = rows.map((row) => ({ city: row.cidade, state: row.estado }))
  const keys = new Set(cities.map((item) => `${item.city}-${item.state}`))

  dummyHotels.forEach((hotel) => {
    const key = `${hotel.city}-${hotel.state}`
    if (!keys.has(key)) {
      cities.push({ city: hotel.city, state: hotel.state })
      keys.add(key)
    }
  })

  return cities.sort((a, b) => a.city.localeCompare(b.city) || a.state.localeCompare(b.state))
}

export async function getUniqueStates() {
  const rows = querySQLite('SELECT DISTINCT estado FROM hoteis ORDER BY estado')
  return [...new Set([...rows.map((row) => row.estado), ...dummyHotels.map((hotel) => hotel.state)])].sort()
}
