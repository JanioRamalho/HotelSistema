import { hotels } from './hotel-data'
import { Amenity, Hotel } from './hotel-types'

type HotelSearchFilters = {
  city?: string
  state?: string
  guests?: number
  priceMin?: number
  priceMax?: number
  amenities?: Amenity[]
  minRating?: number
  stars?: number[]
}

export function searchHotels(filters: HotelSearchFilters): Hotel[] {
  return hotels.filter((hotel) => {
    if (filters.city && !hotel.city.toLowerCase().includes(filters.city.toLowerCase())) {
      return false
    }

    if (filters.state && hotel.state !== filters.state) {
      return false
    }

    if (filters.guests) {
      const hasCapacity = hotel.rooms.some((room) => room.capacity >= filters.guests!)
      if (!hasCapacity) return false
    }

    if (filters.priceMin && hotel.priceFrom < filters.priceMin) {
      return false
    }

    if (filters.priceMax && hotel.priceFrom > filters.priceMax) {
      return false
    }

    if (filters.amenities && filters.amenities.length > 0) {
      const hasAllAmenities = filters.amenities.every((amenity) => hotel.amenities.includes(amenity))
      if (!hasAllAmenities) return false
    }

    if (filters.minRating && hotel.rating < filters.minRating) {
      return false
    }

    if (filters.stars && filters.stars.length > 0 && !filters.stars.includes(hotel.stars)) {
      return false
    }

    return true
  })
}

export function getHotelBySlug(slug: string): Hotel | undefined {
  return hotels.find((hotel) => hotel.slug === slug)
}

export function getHotelById(id: string): Hotel | undefined {
  return hotels.find((hotel) => hotel.id === id)
}

export function getUniqueCities(): { city: string; state: string }[] {
  const unique = new Map<string, { city: string; state: string }>()

  hotels.forEach((hotel) => {
    const key = `${hotel.city}-${hotel.state}`

    if (!unique.has(key)) {
      unique.set(key, { city: hotel.city, state: hotel.state })
    }
  })

  return Array.from(unique.values())
}

export function getUniqueStates(): string[] {
  const states = new Set<string>()

  hotels.forEach((hotel) => states.add(hotel.state))

  return Array.from(states).sort()
}
