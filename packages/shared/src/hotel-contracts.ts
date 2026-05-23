export type Amenity =
  | 'wifi'
  | 'pool'
  | 'gym'
  | 'spa'
  | 'sauna'
  | 'massage'
  | 'pet-friendly'
  | 'restaurant'
  | 'bar'
  | 'room-service'
  | 'parking'
  | 'air-conditioning'
  | 'breakfast'
  | 'beach-access'
  | 'kids-club'
  | 'concierge'
  | 'laundry'
  | 'business-center'

export type RoomCategory = 'economic' | 'standard' | 'luxury'

export interface HotelImageContract {
  url: string
  alt: string
  category: 'exterior' | 'room' | 'amenity' | 'restaurant' | 'pool' | 'common'
}

export interface RoomContract {
  id: string
  name: string
  description: string
  category: RoomCategory
  price: number
  capacity: number
  size: number
  amenities: Amenity[]
  images: string[]
  available: boolean
}

export interface ReviewContract {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment: string
  date: string
  stayDate: string
}

export interface HotelContract {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  address: string
  city: string
  state: string
  country: string
  zipCode: string
  latitude: number
  longitude: number
  stars: number
  rating: number
  reviewCount: number
  priceFrom: number
  images: HotelImageContract[]
  amenities: Amenity[]
  rooms: RoomContract[]
  reviews: ReviewContract[]
  policies: {
    checkIn: string
    checkOut: string
    cancellation: string
    pets: string
    children: string
  }
  contact: {
    phone: string
    email: string
    website?: string
  }
}

export interface HotelSearchQueryContract {
  city?: string
  state?: string
  guests?: number
  priceMin?: number
  priceMax?: number
  amenities?: Amenity[]
  minRating?: number
  stars?: number[]
}

export interface HotelListResponseContract {
  data: HotelContract[]
  meta: {
    total: number
    source: 'hotel-service'
  }
}
