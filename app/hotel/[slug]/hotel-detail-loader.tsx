'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { fetchHotelBySlug } from '@/features/hotels/hotel-api-client'
import { Hotel } from '@/features/hotels/hotel-types'
import { Button } from '@/components/ui/button'
import { HotelDetailClient } from './hotel-detail-client'

interface HotelDetailLoaderProps {
  slug: string
}

export function HotelDetailLoader({ slug }: HotelDetailLoaderProps) {
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadHotel() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchHotelBySlug(slug, controller.signal)
        setHotel(response.data)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return

        setHotel(null)
        setError(err instanceof Error ? err.message : 'Nao foi possivel carregar este hotel.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadHotel()

    return () => controller.abort()
  }, [slug])

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 h-8 w-64 animate-pulse rounded-md bg-muted" />
        <div className="mb-8 grid gap-2 md:grid-cols-4 md:grid-rows-2">
          <div className="aspect-[4/3] animate-pulse rounded-xl bg-muted md:col-span-2 md:row-span-2" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="hidden aspect-[4/3] animate-pulse rounded-xl bg-muted md:block" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="h-10 w-3/4 animate-pulse rounded-md bg-muted" />
            <div className="h-24 animate-pulse rounded-md bg-muted" />
            <div className="h-40 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
      </main>
    )
  }

  if (error || !hotel) {
    return (
      <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">Hotel nao encontrado</h1>
        <p className="mb-6 max-w-md text-muted-foreground">
          Nao foi possivel consultar este hotel pelo API Gateway.
          {error ? ` Detalhe: ${error}` : ''}
        </p>
        <Button asChild>
          <Link href="/busca">Voltar para a busca</Link>
        </Button>
      </main>
    )
  }

  return <HotelDetailClient hotel={hotel} />
}
