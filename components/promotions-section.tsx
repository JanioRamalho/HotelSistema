"use client"

import { useEffect, useState } from 'react'
import { fetchHotels } from '@/features/hotels/hotel-api-client'
import { Hotel } from '@/features/hotels/hotel-types'
import { HotelCard } from './hotel-card'

function getPromoDiscount(hotelId: string) {
  const hash = Array.from(hotelId).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return (hash % 16) + 5
}

export function PromotionsSection() {
  const [promotions, setPromotions] = useState<Array<{ hotel: Hotel; promoDiscount: number }>>([])

  useEffect(() => {
    const controller = new AbortController()

    async function loadPromotions() {
      try {
        const response = await fetchHotels({}, controller.signal)
        const selected: Array<{ hotel: Hotel; promoDiscount: number }> = []

        for (const hotel of response.data) {
          selected.push({ hotel, promoDiscount: getPromoDiscount(hotel.id) })

          if (selected.length === 10) break
        }

        setPromotions(selected)
      } catch {
        setPromotions([])
      }
    }

    loadPromotions()
    return () => controller.abort()
  }, [])

  if (!promotions.length) return null

  return (
    <section className="container mx-auto px-4 py-16" id="promocoes">
      <div className="mb-10 text-center">
        <h2 className="mb-3 font-serif text-3xl font-bold text-foreground sm:text-4xl">
          Promoções
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground text-pretty">
          Aproveite ofertas exclusivas em hotéis selecionados para sua próxima viagem
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {promotions.map(({ hotel, promoDiscount }) => (
          <HotelCard key={hotel.id} hotel={hotel} promoDiscount={promoDiscount} />
        ))}
      </div>
    </section>
  )
}
