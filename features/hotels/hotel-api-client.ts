import { Amenity, Hotel } from './hotel-types'

const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4100'

type FetchHotelsParams = {
  city?: string
  state?: string
  guests?: number
  priceMin?: number
  priceMax?: number
  amenities?: Amenity[]
  minRating?: number
  stars?: number[]
}

type HotelListResponse = {
  data: Hotel[]
  meta: {
    total: number
    source: string
  }
}

type HotelDetailResponse = {
  data: Hotel
  meta: {
    source: string
  }
}

function appendParam(params: URLSearchParams, key: string, value: string | number | undefined) {
  if (value !== undefined && value !== '') {
    params.set(key, String(value))
  }
}

export async function fetchHotels(params: FetchHotelsParams, signal?: AbortSignal): Promise<HotelListResponse> {
  const searchParams = new URLSearchParams()

  appendParam(searchParams, 'city', params.city)
  appendParam(searchParams, 'state', params.state)
  appendParam(searchParams, 'guests', params.guests)
  appendParam(searchParams, 'priceMin', params.priceMin)
  appendParam(searchParams, 'priceMax', params.priceMax)
  appendParam(searchParams, 'minRating', params.minRating)

  if (params.amenities?.length) {
    searchParams.set('amenities', params.amenities.join(','))
  }

  if (params.stars?.length) {
    searchParams.set('stars', params.stars.join(','))
  }

  const response = await fetch(`${apiGatewayUrl}/api/hotels?${searchParams.toString()}`, {
    signal,
    headers: {
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Gateway respondeu com status ${response.status}`)
  }

  return response.json()
}

export async function fetchHotelBySlug(slug: string, signal?: AbortSignal): Promise<HotelDetailResponse> {
  const response = await fetch(`${apiGatewayUrl}/api/hotels/${encodeURIComponent(slug)}`, {
    signal,
    headers: {
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Gateway respondeu com status ${response.status}`)
  }

  return response.json()
}
