'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Calendar, Users, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { popularCities } from '@/features/hotels/hotel-types'

export function HeroSection() {
  const router = useRouter()
  const [destination, setDestination] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('2')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredCities = popularCities
    .filter(
      (city) =>
        city.city.toLowerCase().includes(destination.toLowerCase()) ||
        city.state.toLowerCase().includes(destination.toLowerCase())
    )
    .slice(0, 5)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (destination) params.set('destino', destination)
    if (checkIn) params.set('checkin', checkIn)
    if (checkOut) params.set('checkout', checkOut)
    if (guests) params.set('hospedes', guests)

    router.push(`/busca?${params.toString()}`)
  }

  const handleCitySelect = (city: string, state: string) => {
    setDestination(`${city}, ${state}`)
    setShowSuggestions(false)
  }

  return (
    <section className="relative min-h-[600px] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
      </div>

      <div className="relative z-10 flex min-h-[600px] flex-col items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl text-balance">
            Encontre o hotel perfeito para sua viagem
          </h1>
          <p className="mb-8 text-lg text-white/90 sm:text-xl text-pretty">
            Compare preços, veja avaliações e reserve hotéis em todo o Brasil com as melhores ofertas
          </p>
        </div>

        <div className="w-full max-w-5xl rounded-2xl bg-card p-4 shadow-2xl sm:p-6">
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
            <div className="relative md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Destino
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Para onde você vai?"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value)
                    setShowSuggestions(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowSuggestions(destination.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="h-12 pl-10"
                />
                {showSuggestions && filteredCities.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {filteredCities.map((city) => (
                      <button
                        key={`${city.city}-${city.state}`}
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted"
                        onClick={() => handleCitySelect(city.city, city.state)}
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {city.city}, <span className="text-muted-foreground">{city.state}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Check-in
              </label>
              <DatePickerField
                value={checkIn}
                onChange={setCheckIn}
                minDate={new Date().toISOString().split('T')[0]}
                className="h-12"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Check-out
              </label>
              <DatePickerField
                value={checkOut}
                onChange={setCheckOut}
                minDate={checkIn || new Date().toISOString().split('T')[0]}
                className="h-12"
              />
            </div>

            <div className="flex gap-2 md:col-span-4 lg:col-span-1">
              <div className="flex-1 lg:flex-none">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Hóspedes
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="h-12 w-full appearance-none rounded-md border border-input bg-background pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring lg:w-24"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} size="lg" className="h-12 gap-2 px-6">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Buscar</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-8 text-center text-white/90">
          <div>
            <p className="text-2xl font-bold">30+</p>
            <p className="text-sm">Hotéis</p>
          </div>
          <div>
            <p className="text-2xl font-bold">17+</p>
            <p className="text-sm">Cidades</p>
          </div>
          <div>
            <p className="text-2xl font-bold">10k+</p>
            <p className="text-sm">Avaliações</p>
          </div>
          <div>
            <p className="text-2xl font-bold">98%</p>
            <p className="text-sm">Satisfação</p>
          </div>
        </div>
      </div>
    </section>
  )
}
