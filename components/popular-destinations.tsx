'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { fetchHotels } from '@/features/hotels/hotel-api-client'
import { Hotel } from '@/features/hotels/hotel-types'
import { HotelCard } from './hotel-card'

const popularDestinations = [
  {
    city: 'Rio de Janeiro',
    state: 'RJ',
    image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600',
  },
  {
    city: 'Salvador',
    state: 'BA',
    image: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=600',
  },
  {
    city: 'Gramado',
    state: 'RS',
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600',
  },
  {
    city: 'Fortaleza',
    state: 'CE',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  },
]

export function PopularDestinations() {
  const [hotels, setHotels] = useState<Hotel[]>([])

  useEffect(() => {
    const controller = new AbortController()

    async function loadFeaturedHotels() {
      try {
        const response = await fetchHotels({}, controller.signal)
        setHotels(response.data)
      } catch {
        setHotels([])
      }
    }

    loadFeaturedHotels()

    return () => controller.abort()
  }, [])

  const destinationCounts = useMemo(() => {
    const counts = new Map<string, number>()

    hotels.forEach((hotel) => {
      const key = `${hotel.city}-${hotel.state}`
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    return counts
  }, [hotels])

  const getDestinationHotelCount = (city: string, state: string) =>
    destinationCounts.get(`${city}-${state}`) || 0

  return (
    <section id="destinos" className="bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="mb-3 font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Destinos Populares
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-pretty">
            Explore os destinos mais procurados do Brasil e encontre a hospedagem perfeita
          </p>
        </div>

        <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularDestinations.map((destination) => (
            <Link
              key={`${destination.city}-${destination.state}`}
              href={`/busca?destino=${encodeURIComponent(destination.city)}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl"
            >
              <Image
                src={destination.image}
                alt={destination.city}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="text-xl font-bold text-white">{destination.city}</h3>
                <p className="text-sm text-white/80">
                  {getDestinationHotelCount(destination.city, destination.state)} hotéis
                </p>
              </div>
              <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <ArrowRight className="h-5 w-5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">Hotéis em Destaque</h3>
            <p className="text-muted-foreground">Selecionados especialmente para você</p>
          </div>
          <Link
            href="/busca"
            className="hidden items-center gap-2 text-sm font-medium text-primary hover:underline sm:flex"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {hotels.slice(0, 4).map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/busca"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Ver todos os hotéis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
