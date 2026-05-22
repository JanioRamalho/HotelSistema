'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ChevronLeft, 
  ChevronRight,
  X,
  Clock,
  Users,
  Maximize2,
  Wifi,
  Dumbbell,
  Waves,
  PawPrint,
  Sparkles,
  UtensilsCrossed,
  Car,
  Wind,
  Coffee,
  Umbrella,
  Baby,
  Briefcase,
  GlassWater,
  Bed,
  ConciergeBell,
  Shirt
} from 'lucide-react'
import { Hotel, Amenity, amenityLabels, Room } from '@/features/hotels/hotel-types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  hotel: Hotel
}

const amenityIcons: Record<Amenity, React.ReactNode> = {
  'wifi': <Wifi className="h-5 w-5" />,
  'pool': <Waves className="h-5 w-5" />,
  'gym': <Dumbbell className="h-5 w-5" />,
  'spa': <Sparkles className="h-5 w-5" />,
  'sauna': <Sparkles className="h-5 w-5" />,
  'massage': <Sparkles className="h-5 w-5" />,
  'pet-friendly': <PawPrint className="h-5 w-5" />,
  'restaurant': <UtensilsCrossed className="h-5 w-5" />,
  'bar': <GlassWater className="h-5 w-5" />,
  'room-service': <ConciergeBell className="h-5 w-5" />,
  'parking': <Car className="h-5 w-5" />,
  'air-conditioning': <Wind className="h-5 w-5" />,
  'breakfast': <Coffee className="h-5 w-5" />,
  'beach-access': <Umbrella className="h-5 w-5" />,
  'kids-club': <Baby className="h-5 w-5" />,
  'concierge': <ConciergeBell className="h-5 w-5" />,
  'laundry': <Shirt className="h-5 w-5" />,
  'business-center': <Briefcase className="h-5 w-5" />,
}

export function HotelDetailClient({ hotel }: Props) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % hotel.images.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + hotel.images.length) % hotel.images.length)
  }

  const getRoomCategoryLabel = (category: string) => {
    switch (category) {
      case 'economic': return 'Econômico'
      case 'standard': return 'Intermediário'
      case 'luxury': return 'Luxo'
      default: return category
    }
  }

  const getRoomCategoryColor = (category: string) => {
    switch (category) {
      case 'economic': return 'bg-green-100 text-green-800'
      case 'standard': return 'bg-blue-100 text-blue-800'
      case 'luxury': return 'bg-amber-100 text-amber-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <main>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/50">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Início</Link>
            <span>/</span>
            <Link href="/busca" className="hover:text-foreground">Hotéis</Link>
            <span>/</span>
            <span className="text-foreground">{hotel.name}</span>
          </nav>
        </div>
      </div>

      {/* Image Gallery */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2">
          {/* Main Image */}
          <div 
            className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl md:col-span-2 md:row-span-2"
            onClick={() => setShowGallery(true)}
          >
            <Image
              src={hotel.images[0]?.url}
              alt={hotel.images[0]?.alt}
              fill
              className="object-cover transition-transform hover:scale-105"
              priority
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/20">
              <Maximize2 className="h-8 w-8 text-white opacity-0 transition-opacity hover:opacity-100" />
            </div>
          </div>
          
          {/* Secondary Images */}
          {hotel.images.slice(1, 5).map((image, index) => (
            <div 
              key={index}
              className="relative hidden aspect-[4/3] cursor-pointer overflow-hidden rounded-xl md:block"
              onClick={() => {
                setSelectedImageIndex(index + 1)
                setShowGallery(true)
              }}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover transition-transform hover:scale-105"
              />
              {index === 3 && hotel.images.length > 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-lg font-semibold text-white">
                    +{hotel.images.length - 5} fotos
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: View All Photos Button */}
        <Button 
          variant="outline" 
          className="mt-4 w-full md:hidden"
          onClick={() => setShowGallery(true)}
        >
          Ver todas as {hotel.images.length} fotos
        </Button>
      </section>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setShowGallery(false)}
          >
            <X className="h-6 w-6" />
          </button>
          
          <button
            className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={prevImage}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <div className="relative h-[80vh] w-[90vw] max-w-5xl">
            <Image
              src={hotel.images[selectedImageIndex].url}
              alt={hotel.images[selectedImageIndex].alt}
              fill
              className="object-contain"
            />
          </div>
          
          <button
            className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={nextImage}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {selectedImageIndex + 1} / {hotel.images.length}
          </div>
        </div>
      )}

      {/* Hotel Info & Rooms */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <Badge variant="secondary">
                  <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {hotel.rating} ({hotel.reviewCount} avaliações)
                </Badge>
              </div>
              
              <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
                {hotel.name}
              </h1>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{hotel.address}, {hotel.city} - {hotel.state}</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground">Sobre o Hotel</h2>
              <p className="text-muted-foreground leading-relaxed">
                {hotel.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Comodidades</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {hotel.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 rounded-lg bg-muted p-3"
                  >
                    <span className="text-primary">{amenityIcons[amenity]}</span>
                    <span className="text-sm text-foreground">{amenityLabels[amenity]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rooms */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Quartos Disponíveis</h2>
              <div className="space-y-4">
                {hotel.rooms.map((room) => (
                  <article
                    key={room.id}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Room Image */}
                      <div className="relative aspect-video w-full sm:aspect-square sm:w-48">
                        <Image
                          src={room.images[0]}
                          alt={room.name}
                          fill
                          className="object-cover"
                        />
                        <Badge className={`absolute left-2 top-2 ${getRoomCategoryColor(room.category)}`}>
                          {getRoomCategoryLabel(room.category)}
                        </Badge>
                      </div>
                      
                      {/* Room Info */}
                      <div className="flex flex-1 flex-col p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="font-semibold text-foreground">{room.name}</h3>
                        </div>
                        
                        <p className="mb-3 text-sm text-muted-foreground">
                          {room.description}
                        </p>
                        
                        <div className="mb-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Até {room.capacity} pessoas
                          </span>
                          <span className="flex items-center gap-1">
                            <Maximize2 className="h-4 w-4" />
                            {room.size} m²
                          </span>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">A partir de</p>
                            <p className="text-xl font-bold text-foreground">
                              R$ {room.price.toLocaleString('pt-BR')}
                              <span className="text-sm font-normal text-muted-foreground">/noite</span>
                            </p>
                          </div>
                          <Button onClick={() => setSelectedRoom(room)}>
                            Reservar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Avaliações dos Hóspedes</h2>
              <div className="space-y-4">
                {hotel.reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          {review.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{review.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            Hospedou-se em {new Date(review.stayDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </article>
                ))}
              </div>
            </div>

            {/* Policies */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">Políticas do Hotel</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-medium">Horários</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Check-in: {hotel.policies.checkIn}<br />
                    Check-out: {hotel.policies.checkOut}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <X className="h-5 w-5 text-primary" />
                    <span className="font-medium">Cancelamento</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {hotel.policies.cancellation}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <PawPrint className="h-5 w-5 text-primary" />
                    <span className="font-medium">Pets</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {hotel.policies.pets}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Baby className="h-5 w-5 text-primary" />
                    <span className="font-medium">Crianças</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {hotel.policies.children}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-lg">
              <div className="mb-4 text-center">
                <p className="text-sm text-muted-foreground">A partir de</p>
                <p className="text-3xl font-bold text-foreground">
                  R$ {hotel.priceFrom.toLocaleString('pt-BR')}
                  <span className="text-base font-normal text-muted-foreground">/noite</span>
                </p>
              </div>

              <div className="mb-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Check-in
                  </label>
                  <input
                    type="date"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Check-out
                  </label>
                  <input
                    type="date"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Hóspedes
                  </label>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'hóspede' : 'hóspedes'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button className="mb-4 w-full" size="lg">
                Verificar Disponibilidade
              </Button>

              <p className="mb-4 text-center text-xs text-muted-foreground">
                Você ainda não será cobrado
              </p>

              <hr className="mb-4 border-border" />

              {/* Contact */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Contato</p>
                <a 
                  href={`tel:${hotel.contact.phone}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-4 w-4" />
                  {hotel.contact.phone}
                </a>
                <a 
                  href={`mailto:${hotel.contact.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  {hotel.contact.email}
                </a>
                {hotel.contact.website && (
                  <a 
                    href={`https://${hotel.contact.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="h-4 w-4" />
                    {hotel.contact.website}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Room Booking Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Reservar {selectedRoom.name}</h3>
              <button onClick={() => setSelectedRoom(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-2xl font-bold">
                R$ {selectedRoom.price.toLocaleString('pt-BR')}
                <span className="text-sm font-normal text-muted-foreground">/noite</span>
              </p>
            </div>

            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Check-in</label>
                <input
                  type="date"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Check-out</label>
                <input
                  type="date"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
            </div>

            <Button className="w-full" size="lg">
              Confirmar Reserva
            </Button>
            
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Você receberá a confirmação por e-mail
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
