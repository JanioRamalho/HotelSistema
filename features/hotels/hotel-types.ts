// Tipos para a plataforma de reservas de hotéis

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

export const amenityLabels: Record<Amenity, string> = {
  wifi: 'Wi-Fi Grátis',
  pool: 'Piscina',
  gym: 'Academia',
  spa: 'Spa',
  sauna: 'Sauna',
  massage: 'Massagem',
  'pet-friendly': 'Pet Friendly',
  restaurant: 'Restaurante',
  bar: 'Bar',
  'room-service': 'Serviço de Quarto',
  parking: 'Estacionamento',
  'air-conditioning': 'Ar Condicionado',
  breakfast: 'Café da Manhã',
  'beach-access': 'Acesso à Praia',
  'kids-club': 'Kids Club',
  concierge: 'Concierge',
  laundry: 'Lavanderia',
  'business-center': 'Centro de Negócios',
}

export interface HotelImage {
  url: string
  alt: string
  category: 'exterior' | 'room' | 'amenity' | 'restaurant' | 'pool' | 'common'
}

export interface Room {
  id: string
  name: string
  description: string
  category: 'economic' | 'standard' | 'luxury'
  price: number
  capacity: number
  size: number
  amenities: Amenity[]
  images: string[]
  available: boolean
}

export interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment: string
  date: string
  stayDate: string
}

export interface Hotel {
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
  images: HotelImage[]
  amenities: Amenity[]
  rooms: Room[]
  reviews: Review[]
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

export interface SearchFilters {
  city?: string
  state?: string
  checkIn?: Date
  checkOut?: Date
  guests?: number
  priceMin?: number
  priceMax?: number
  amenities?: Amenity[]
  minRating?: number
  stars?: number[]
}

export interface BookingRequest {
  hotelId: string
  roomId: string
  checkIn: Date
  checkOut: Date
  guests: number
  guestInfo: {
    name: string
    email: string
    phone: string
    document: string
  }
  specialRequests?: string
}

export const brazilianStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

export const popularCities = [
  { city: 'Rio de Janeiro', state: 'RJ' },
  { city: 'São Paulo', state: 'SP' },
  { city: 'Salvador', state: 'BA' },
  { city: 'Florianópolis', state: 'SC' },
  { city: 'Fortaleza', state: 'CE' },
  { city: 'Recife', state: 'PE' },
  { city: 'Natal', state: 'RN' },
  { city: 'Porto Alegre', state: 'RS' },
  { city: 'Curitiba', state: 'PR' },
  { city: 'Belo Horizonte', state: 'MG' },
  { city: 'Gramado', state: 'RS' },
  { city: 'Búzios', state: 'RJ' },
  { city: 'Maceió', state: 'AL' },
  { city: 'Paraty', state: 'RJ' },
  { city: 'Campos do Jordão', state: 'SP' },
]
