import { Amenity, Hotel } from './hotel-types'

const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4100'
const defaultTimeoutMs = 8_000

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

function createTimeoutSignal(signal?: AbortSignal, timeoutMs = defaultTimeoutMs) {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)

  if (signal?.aborted) {
    controller.abort()
  } else {
    signal?.addEventListener('abort', () => controller.abort(), { once: true })
  }

  return {
    signal: controller.signal,
    clear: () => globalThis.clearTimeout(timeout),
  }
}

function getFetchErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Tempo esgotado ao consultar o API Gateway.'
  }

  return error instanceof Error ? error.message : 'Nao foi possivel consultar o API Gateway.'
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

  const timeout = createTimeoutSignal(signal)

  try {
    const response = await fetch(`${apiGatewayUrl}/api/hotels/unique-images?${searchParams.toString()}`, {
      signal: timeout.signal,
      headers: {
        accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Gateway respondeu com status ${response.status}`)
    }

    return response.json()
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error(getFetchErrorMessage(error))
  } finally {
    timeout.clear()
  }
}

export async function fetchHotelBySlug(slug: string, signal?: AbortSignal): Promise<HotelDetailResponse> {
  const timeout = createTimeoutSignal(signal)

  try {
    const response = await fetch(`${apiGatewayUrl}/api/hotels/${encodeURIComponent(slug)}`, {
      signal: timeout.signal,
      headers: {
        accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Gateway respondeu com status ${response.status}`)
    }

    return response.json()
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error(getFetchErrorMessage(error))
  } finally {
    timeout.clear()
  }
}

