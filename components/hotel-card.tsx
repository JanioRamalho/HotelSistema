'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, Heart, Wifi, Dumbbell, Waves, PawPrint, Coffee, Car } from 'lucide-react'
import { Hotel, Amenity } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HotelCardProps {
  hotel: Hotel
}

const amenityIcons: Partial<Record<Amenity, React.ReactNode>> = {
  'wifi': <Wifi className="h-3.5 w-3.5" />,
  'gym': <Dumbbell className="h-3.5 w-3.5" />,
  'pool': <Waves className="h-3.5 w-3.5" />,
  'pet-friendly': <PawPrint className="h-3.5 w-3.5" />,
  'breakfast': <Coffee className="h-3.5 w-3.5" />,
  'parking': <Car className="h-3.5 w-3.5" />,
}

export function HotelCard({ hotel }: HotelCardProps) {
  const displayedAmenities = hotel.amenities.slice(0, 4)

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={hotel.images[0]?.url || '/placeholder.jpg'}
          alt={hotel.images[0]?.alt || hotel.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <button 
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-muted-foreground transition-colors hover:bg-white hover:text-red-500"
          aria-label="Adicionar aos favoritos"
        >
          <Heart className="h-5 w-5" />
        </button>
        {hotel.stars >= 5 && (
          <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
            Premium
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Location & Rating */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{hotel.city}, {hotel.state}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{hotel.rating}</span>
            <span className="text-xs text-muted-foreground">({hotel.reviewCount})</span>
          </div>
        </div>

        {/* Name & Stars */}
        <div className="mb-2">
          <Link href={`/hotel/${hotel.slug}`}>
            <h3 className="font-semibold text-foreground transition-colors hover:text-primary line-clamp-1">
              {hotel.name}
            </h3>
          </Link>
          <div className="mt-1 flex items-center gap-0.5">
            {Array.from({ length: hotel.stars }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-primary text-primary" />
            ))}
          </div>
        </div>

        {/* Description */}
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {hotel.shortDescription}
        </p>

        {/* Amenities */}
        <div className="mb-4 flex flex-wrap gap-2">
          {displayedAmenities.map((amenity) => (
            <span 
              key={amenity}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              {amenityIcons[amenity]}
            </span>
          ))}
          {hotel.amenities.length > 4 && (
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              +{hotel.amenities.length - 4}
            </span>
          )}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">A partir de</p>
            <p className="text-lg font-bold text-foreground">
              R$ {hotel.priceFrom.toLocaleString('pt-BR')}
              <span className="text-sm font-normal text-muted-foreground">/noite</span>
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={`/hotel/${hotel.slug}`}>
              Ver detalhes
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
