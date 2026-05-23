import { getSQLiteDatabasePath, getSQLite, initializeSQLiteDatabase, querySQLite } from '../database/sqlite-client.js'

initializeSQLiteDatabase()

export function getHotelDataSource() {
  return 'sqlite-local'
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
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country,
    zipCode: row.zip_code,
    latitude: row.latitude,
    longitude: row.longitude,
    stars: row.stars,
    rating: row.rating,
    reviewCount: row.review_count,
    priceFrom: row.price_from,
    images: [],
    amenities: [],
    rooms: [],
    reviews: [],
    policies: {
      checkIn: row.policy_check_in,
      checkOut: row.policy_check_out,
      cancellation: row.policy_cancellation,
      pets: row.policy_pets,
      children: row.policy_children,
    },
    contact: {
      phone: row.contact_phone,
      email: row.contact_email,
      ...(row.contact_website ? { website: row.contact_website } : {}),
    },
  }
}

async function hydrateHotels(hotelRows) {
  const hotels = hotelRows.map(mapHotelRow)

  hotels.forEach((hotel) => {
    const images = querySQLite(
      `SELECT url, alt, category
       FROM hotel_images
       WHERE hotel_id = ?
       ORDER BY sort_order, id`,
      [hotel.id]
    )
    const amenities = querySQLite(
      `SELECT amenity_id
       FROM hotel_amenities
       WHERE hotel_id = ?
       ORDER BY amenity_id`,
      [hotel.id]
    )
    const rooms = querySQLite(
      `SELECT id, name, description, category, price, capacity, size, available
       FROM rooms
       WHERE hotel_id = ?
       ORDER BY price, id`,
      [hotel.id]
    )
    const reviews = querySQLite(
      `SELECT id, COALESCE(user_id, '') AS user_id, user_name, user_avatar, rating, comment, date, stay_date
       FROM reviews
       WHERE hotel_id = ?
       ORDER BY date DESC, id`,
      [hotel.id]
    )

    hotel.images = images.map((image) => ({
      url: image.url,
      alt: image.alt,
      category: image.category,
    }))
    hotel.amenities = amenities.map((amenity) => amenity.amenity_id)
    hotel.reviews = reviews.map((review) => ({
      id: review.id,
      userId: review.user_id,
      userName: review.user_name,
      ...(review.user_avatar ? { userAvatar: review.user_avatar } : {}),
      rating: review.rating,
      comment: review.comment,
      date: review.date,
      stayDate: review.stay_date,
    }))
    hotel.rooms = rooms.map((room) => {
      const roomImages = querySQLite(
        `SELECT url
         FROM room_images
         WHERE room_id = ?
         ORDER BY sort_order, id`,
        [room.id]
      )
      const roomAmenities = querySQLite(
        `SELECT amenity_id
         FROM room_amenities
         WHERE room_id = ?
         ORDER BY amenity_id`,
        [room.id]
      )

      return {
        id: room.id,
        name: room.name,
        description: room.description,
        category: room.category,
        price: room.price,
        capacity: room.capacity,
        size: room.size,
        amenities: roomAmenities.map((amenity) => amenity.amenity_id),
        images: roomImages.map((image) => image.url),
        available: Boolean(room.available),
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

export async function searchHotels(filters) {
  const conditions = []
  const params = []

  if (filters.city) {
    conditions.push('LOWER(h.city) LIKE LOWER(?)')
    params.push(`%${filters.city}%`)
  }

  if (filters.state) {
    conditions.push('h.state = ?')
    params.push(filters.state)
  }

  if (filters.guests) {
    conditions.push('EXISTS (SELECT 1 FROM rooms r WHERE r.hotel_id = h.id AND r.capacity >= ?)')
    params.push(filters.guests)
  }

  if (filters.priceMin) {
    conditions.push('h.price_from >= ?')
    params.push(filters.priceMin)
  }

  if (filters.priceMax) {
    conditions.push('h.price_from <= ?')
    params.push(filters.priceMax)
  }

  if (filters.minRating) {
    conditions.push('h.rating >= ?')
    params.push(filters.minRating)
  }

  if (filters.stars.length > 0) {
    conditions.push(`h.stars IN (${filters.stars.map(() => '?').join(', ')})`)
    params.push(...filters.stars)
  }

  filters.amenities.forEach((amenity) => {
    conditions.push('EXISTS (SELECT 1 FROM hotel_amenities ha WHERE ha.hotel_id = h.id AND ha.amenity_id = ?)')
    params.push(amenity)
  })

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = querySQLite(
    `SELECT h.*
     FROM hotels h
     ${where}
     ORDER BY h.rating DESC, h.review_count DESC, h.name ASC`,
    params
  )

  return hydrateHotels(rows)
}

export async function getHotelBySlug(slug) {
  const hotel = getSQLite('SELECT * FROM hotels WHERE slug = ? LIMIT 1', [slug])
  const hotels = await hydrateHotels(hotel ? [hotel] : [])
  return hotels[0]
}

export async function getUniqueCities() {
  return querySQLite('SELECT DISTINCT city, state FROM hotels ORDER BY city, state')
}

export async function getUniqueStates() {
  const rows = querySQLite('SELECT DISTINCT state FROM hotels ORDER BY state')
  return rows.map((row) => row.state)
}
