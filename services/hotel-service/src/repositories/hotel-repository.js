import { execSQLite, getSQLiteDatabasePath, getSQLite, initializeSQLiteDatabase, querySQLite, runSQLite } from '../database/sqlite-client.js'
import { dummyHotels } from '../data/dummy-hotels.js'
import { fetchFakeHotels } from '../demo/fake-hotel-provider.js'
import { uniqueHotelImages } from '../data/unique-hotel-images.js'

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

function getKnownHotelSlugs() {
  const databaseSlugs = querySQLite(
    `SELECT slug
     FROM hoteis
     ORDER BY nota DESC, quantidade_avaliacoes DESC, nome ASC`
  ).map((row) => row.slug)
  const seen = new Set(databaseSlugs)
  const dummySlugs = searchDummyHotels({ amenities: [], stars: [] })
    .filter((hotel) => !seen.has(hotel.slug))
    .map((hotel) => hotel.slug)

  return [...databaseSlugs, ...dummySlugs]
}

function assignUniqueImages(hotels) {
  const knownSlugs = getKnownHotelSlugs()

  return hotels.map((hotel) => {
    const fallbackImages = Array.isArray(hotel.images) ? hotel.images : []
    const slugIndex = knownSlugs.indexOf(hotel.slug)
    const imageIndex = slugIndex >= 0 ? slugIndex % uniqueHotelImages.length : 0
    const candidate = uniqueHotelImages[imageIndex] || fallbackImages[0]

    if (!candidate) {
      return hotel
    }

    return {
      ...hotel,
      images: [
        {
          url: candidate.url,
          alt: candidate.alt || hotel.name,
          category: candidate.category || 'exterior',
        },
        ...fallbackImages.slice(1),
      ],
    }
  })
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
  const mergedHotels = mergeHotels(databaseHotels, searchDummyHotels(filters))

  return assignUniqueImages(mergedHotels)
}

export async function getHotelBySlug(slug) {
  const hotel = getSQLite('SELECT * FROM hoteis WHERE slug = ? LIMIT 1', [slug])
  const hotels = await hydrateHotels(hotel ? [hotel] : [])
  const result = hotels[0] || dummyHotels.find((item) => item.slug === slug)

  if (!result) {
    return result
  }

  return assignUniqueImages([result])[0]
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

function saveGeneratedHotel(hotel) {
  runSQLite(
    `INSERT INTO hoteis (
       id, nome, slug, descricao, descricao_curta, endereco, cidade, estado, pais, cep,
       latitude, longitude, estrelas, nota, quantidade_avaliacoes, preco_inicial,
       politica_check_in, politica_check_out, politica_cancelamento, politica_pets, politica_criancas,
       contato_telefone, contato_email, contato_site
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nome = excluded.nome,
       slug = excluded.slug,
       descricao = excluded.descricao,
       descricao_curta = excluded.descricao_curta,
       endereco = excluded.endereco,
       cidade = excluded.cidade,
       estado = excluded.estado,
       pais = excluded.pais,
       cep = excluded.cep,
       latitude = excluded.latitude,
       longitude = excluded.longitude,
       estrelas = excluded.estrelas,
       nota = excluded.nota,
       quantidade_avaliacoes = excluded.quantidade_avaliacoes,
       preco_inicial = excluded.preco_inicial,
       politica_check_in = excluded.politica_check_in,
       politica_check_out = excluded.politica_check_out,
       politica_cancelamento = excluded.politica_cancelamento,
       politica_pets = excluded.politica_pets,
       politica_criancas = excluded.politica_criancas,
       contato_telefone = excluded.contato_telefone,
       contato_email = excluded.contato_email,
       contato_site = excluded.contato_site,
       atualizado_em = CURRENT_TIMESTAMP`,
    [
      hotel.id,
      hotel.name,
      hotel.slug,
      hotel.description,
      hotel.shortDescription,
      hotel.address,
      hotel.city,
      hotel.state,
      hotel.country,
      hotel.zipCode,
      hotel.latitude,
      hotel.longitude,
      hotel.stars,
      hotel.rating,
      hotel.reviewCount,
      hotel.priceFrom,
      hotel.policies.checkIn,
      hotel.policies.checkOut,
      hotel.policies.cancellation,
      hotel.policies.pets,
      hotel.policies.children,
      hotel.contact.phone,
      hotel.contact.email,
      hotel.contact.website,
    ]
  )

  hotel.images.forEach((image) => {
    runSQLite(
      `INSERT INTO imagens_hotel (id, hotel_id, url, texto_alternativo, categoria, ordem)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         hotel_id = excluded.hotel_id,
         url = excluded.url,
         texto_alternativo = excluded.texto_alternativo,
         categoria = excluded.categoria,
         ordem = excluded.ordem`,
      [image.id, hotel.id, image.url, image.alt, image.category, image.order]
    )
  })

  hotel.amenities.forEach((amenity) => {
    runSQLite(
      'INSERT OR IGNORE INTO hoteis_comodidades (hotel_id, comodidade_id) VALUES (?, ?)',
      [hotel.id, amenity]
    )
  })

  hotel.rooms.forEach((room) => {
    runSQLite(
      `INSERT INTO quartos (id, hotel_id, nome, descricao, categoria, preco, capacidade, tamanho, disponivel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(id) DO UPDATE SET
         hotel_id = excluded.hotel_id,
         nome = excluded.nome,
         descricao = excluded.descricao,
         categoria = excluded.categoria,
         preco = excluded.preco,
         capacidade = excluded.capacidade,
         tamanho = excluded.tamanho,
         disponivel = excluded.disponivel,
         atualizado_em = CURRENT_TIMESTAMP`,
      [room.id, hotel.id, room.name, room.description, room.category, room.price, room.capacity, room.size]
    )

    room.images.forEach((imageUrl, index) => {
      runSQLite(
        `INSERT INTO imagens_quarto (id, quarto_id, url, texto_alternativo, ordem)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           quarto_id = excluded.quarto_id,
           url = excluded.url,
           texto_alternativo = excluded.texto_alternativo,
           ordem = excluded.ordem`,
        [`${room.id}-img-${index + 1}`, room.id, imageUrl, room.name, index + 1]
      )
    })

    room.amenities.forEach((amenity) => {
      runSQLite(
        'INSERT OR IGNORE INTO quartos_comodidades (quarto_id, comodidade_id) VALUES (?, ?)',
        [room.id, amenity]
      )
    })
  })

  hotel.reviews.forEach((review) => {
    runSQLite(
      `INSERT INTO avaliacoes (id, hotel_id, usuario_id, nome_usuario, nota, comentario, data_avaliacao, data_hospedagem)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         hotel_id = excluded.hotel_id,
         nome_usuario = excluded.nome_usuario,
         nota = excluded.nota,
         comentario = excluded.comentario,
         data_avaliacao = excluded.data_avaliacao,
         data_hospedagem = excluded.data_hospedagem`,
      [review.id, hotel.id, review.userName, review.rating, review.comment, review.date, review.stayDate]
    )
  })
}

export async function generateFakeHotels(options = {}) {
  const count = Math.max(1, Math.min(Number(options.count) || 5, 50))
  const hotels = fetchFakeHotels({ ...options, count })

  execSQLite('BEGIN;')
  try {
    hotels.forEach(saveGeneratedHotel)
    execSQLite('COMMIT;')
  } catch (error) {
    execSQLite('ROLLBACK;')
    throw error
  }

  return hydrateHotels(hotels.map((hotel) => getSQLite('SELECT * FROM hoteis WHERE id = ?', [hotel.id])))
}
