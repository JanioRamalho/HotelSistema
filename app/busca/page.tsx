'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { SearchFilters } from '@/components/search-filters'
import { HotelCard } from '@/components/hotel-card'
import { searchHotels } from '@/features/hotels/hotel-service'
import { Amenity } from '@/features/hotels/hotel-types'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type SortOption = 'price-asc' | 'price-desc' | 'rating' | 'stars'

function BuscaContent() {
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState({
    city: searchParams.get('destino')?.split(',')[0] || '',
    state: '',
    priceMin: '',
    priceMax: '',
    amenities: [] as Amenity[],
    minRating: '',
    stars: [] as number[],
  })
  
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Initialize city from URL params
  useEffect(() => {
    const destino = searchParams.get('destino')
    if (destino) {
      const [city] = destino.split(',')
      setFilters(prev => ({ ...prev, city: city.trim() }))
    }
  }, [searchParams])

  // Filter and sort hotels
  const filteredHotels = useMemo(() => {
    let results = searchHotels({
      city: filters.city || undefined,
      state: filters.state || undefined,
      priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
      priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
      amenities: filters.amenities.length > 0 ? filters.amenities : undefined,
      minRating: filters.minRating ? Number(filters.minRating) : undefined,
      stars: filters.stars.length > 0 ? filters.stars : undefined,
    })

    // Sort
    switch (sortBy) {
      case 'price-asc':
        results.sort((a, b) => a.priceFrom - b.priceFrom)
        break
      case 'price-desc':
        results.sort((a, b) => b.priceFrom - a.priceFrom)
        break
      case 'rating':
        results.sort((a, b) => b.rating - a.rating)
        break
      case 'stars':
        results.sort((a, b) => b.stars - a.stars)
        break
    }

    return results
  }, [filters, sortBy])

  const clearFilters = () => {
    setFilters({
      city: '',
      state: '',
      priceMin: '',
      priceMax: '',
      amenities: [],
      minRating: '',
      stars: [],
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
            {filters.city 
              ? `Hotéis em ${filters.city}${filters.state ? `, ${filters.state}` : ''}`
              : 'Todos os Hotéis'
            }
          </h1>
          <p className="text-muted-foreground">
            {filteredHotels.length} {filteredHotels.length === 1 ? 'hotel encontrado' : 'hotéis encontrados'}
          </p>
        </div>

        {/* Quick Search Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por cidade ou nome do hotel..."
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 lg:hidden"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="rating">Melhor avaliados</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="stars">Mais estrelas</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden w-72 flex-shrink-0 lg:block">
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
            />
          </aside>

          {/* Mobile Filters */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 bg-background p-4 lg:hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filtros</h2>
                <Button variant="ghost" onClick={() => setShowMobileFilters(false)}>
                  Fechar
                </Button>
              </div>
              <div className="h-[calc(100vh-120px)] overflow-y-auto">
                <SearchFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  onClearFilters={clearFilters}
                />
              </div>
              <div className="mt-4">
                <Button className="w-full" onClick={() => setShowMobileFilters(false)}>
                  Ver {filteredHotels.length} resultados
                </Button>
              </div>
            </div>
          )}

          {/* Results Grid */}
          <div className="flex-1">
            {filteredHotels.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredHotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Nenhum hotel encontrado
                </h3>
                <p className="mb-4 max-w-md text-muted-foreground">
                  Não encontramos hotéis com os filtros selecionados. Tente ajustar sua busca ou remover alguns filtros.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function BuscaPage() {
  return (
    <Suspense>
      <BuscaContent />
    </Suspense>
  )
}
