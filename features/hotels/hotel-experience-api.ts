const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4100'

export type DemoWallet = {
  user_id: string
  balance_cents: number
}

export type HotelSessionUser = {
  id: string
  name: string
  email: string
}

export type DemoBooking = {
  id: string
  user_id: string
  hotel_id: string
  room_id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: string
  guest_name: string
  guest_email: string
  hotel_name: string
  room_name: string
  created_at: string
}

export type HotelGeolocation = {
  id: string
  name: string
  slug: string
  address: string
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export type CreateDemoBookingInput = {
  roomId: string
  checkIn: string
  checkOut: string
  guests: number
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  guestDocument?: string
  guestBirthdate?: string
  guestZipCode?: string
  specialRequests?: string
}

export type EmailVerificationDelivery = {
  provider: string
  delivered: boolean
}

export type RegisterPasswordInput = {
  name: string
  email: string
  password: string
  phone?: string
  document?: string
  birthdate?: string
  zipCode?: string
}

type AuthenticatedRequestInit = RequestInit & {
  userId?: string
}

async function fetchJson<T>(path: string, init?: AuthenticatedRequestInit): Promise<T> {
  const { userId, ...requestInit } = init || {}
  const response = await fetch(`${apiGatewayUrl}${path}`, {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {}),
      ...requestInit.headers,
    },
    ...requestInit,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || body.error || `Gateway respondeu com status ${response.status}`)
  }

  return response.json()
}

export type RegisterPasswordChallenge = {
  requiresEmailVerification: boolean
  pendingRegistrationId: string
  email: string
  expiresAt: string
  delivery: EmailVerificationDelivery
}

export async function registerWithPassword(input: RegisterPasswordInput): Promise<RegisterPasswordChallenge> {
  const response = await fetchJson<{ data: RegisterPasswordChallenge }>('/api/auth/password/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.data
}

export async function confirmPasswordRegister(email: string, code: string): Promise<HotelSessionUser> {
  const response = await fetchJson<{ data: { user: HotelSessionUser; walletBonusCents: number } }>('/api/auth/password/register/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
  return response.data.user
}

export async function loginWithPassword(email: string, password: string): Promise<HotelSessionUser> {
  const response = await fetchJson<{ data: { user: HotelSessionUser; walletBonusCents: number } }>('/api/auth/password/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return response.data.user
}

export async function fetchDemoWallet(userId: string, signal?: AbortSignal): Promise<DemoWallet> {
  const response = await fetchJson<{ data: DemoWallet }>('/api/wallet/me', { signal, userId })
  return response.data
}

export async function fetchDemoBookings(userId: string, signal?: AbortSignal): Promise<DemoBooking[]> {
  const response = await fetchJson<{ data: DemoBooking[] }>('/api/bookings/me', { signal, userId })
  return response.data
}

export async function fetchHotelGeolocation(slug: string, signal?: AbortSignal): Promise<HotelGeolocation> {
  const response = await fetchJson<{ data: HotelGeolocation }>(`/api/geolocation/hotel/${encodeURIComponent(slug)}`, { signal })
  return response.data
}

export async function createDemoBooking(input: CreateDemoBookingInput, userId: string) {
  return fetchJson<{ data: { bookingId: string; totalCents: number; remainingBalanceCents: number } }>('/api/bookings', {
    method: 'POST',
    userId,
    body: JSON.stringify(input),
  })
}
