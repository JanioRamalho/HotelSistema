'use client'

import { useState } from 'react'
import {
  Filter,
  X,
  ChevronDown,
  Star,
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Amenity, brazilianStates } from '@/features/hotels/hotel-types'

interface SearchFiltersProps {
  filters: {
    city: string
    state: string
    priceMin: string
    priceMax: string
    amenities: Amenity[]
    minRating: string
    stars: number[]
  }
  onFiltersChange: (filters: SearchFiltersProps['filters']) => void
  onClearFilters: () => void
}

const amenityOptions: { value: Amenity; label: string; icon: React.ReactNode }[] = [
  { value: 'wifi', label: 'Wi-Fi Grátis', icon: <Wifi className="h-4 w-4" /> },
  { value: 'pool', label: 'Piscina', icon: <Waves className="h-4 w-4" /> },
  { value: 'gym', label: 'Academia', icon: <Dumbbell className="h-4 w-4" /> },
  { value: 'spa', label: 'Spa', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'sauna', label: 'Sauna', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'massage', label: 'Massagem', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'pet-friendly', label: 'Pet Friendly', icon: <PawPrint className="h-4 w-4" /> },
  { value: 'restaurant', label: 'Restaurante', icon: <UtensilsCrossed className="h-4 w-4" /> },
  { value: 'parking', label: 'Estacionamento', icon: <Car className="h-4 w-4" /> },
  { value: 'air-conditioning', label: 'Ar Condicionado', icon: <Wind className="h-4 w-4" /> },
  { value: 'breakfast', label: 'Café da Manhã', icon: <Coffee className="h-4 w-4" /> },
  { value: 'beach-access', label: 'Acesso à Praia', icon: <Umbrella className="h-4 w-4" /> },
  { value: 'kids-club', label: 'Kids Club', icon: <Baby className="h-4 w-4" /> },
  { value: 'business-center', label: 'Centro de Negócios', icon: <Briefcase className="h-4 w-4" /> },
]

export function SearchFilters({ filters, onFiltersChange, onClearFilters }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['price', 'amenities', 'rating'])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((item) => item !== section) : [...prev, section]
    )
  }

  const handleAmenityToggle = (amenity: Amenity) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((item) => item !== amenity)
      : [...filters.amenities, amenity]
    onFiltersChange({ ...filters, amenities: newAmenities })
  }

  const handleStarsToggle = (star: number) => {
    const newStars = filters.stars.includes(star)
      ? filters.stars.filter((item) => item !== star)
      : [...filters.stars, star]
    onFiltersChange({ ...filters, stars: newStars })
  }

  const hasActiveFilters =
    filters.city ||
    filters.state ||
    filters.priceMin ||
    filters.priceMax ||
    filters.amenities.length > 0 ||
    filters.minRating ||
    filters.stars.length > 0

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        className="flex w-full items-center justify-between p-4 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Filtros</span>
          {hasActiveFilters && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              Ativos
            </span>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`${isOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="p-4">
          <div className="mb-4 hidden items-center justify-between lg:flex">
            <h3 className="flex items-center gap-2 font-semibold">
              <Filter className="h-5 w-5" />
              Filtros
            </h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 text-xs">
                <X className="mr-1 h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>

          <div className="mb-4 border-b border-border pb-4">
            <button
              className="flex w-full items-center justify-between py-2"
              onClick={() => toggleSection('location')}
            >
              <span className="text-sm font-medium">Localização</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedSections.includes('location') ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.includes('location') && (
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="city" className="text-xs text-muted-foreground">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Digite a cidade"
                    value={filters.city}
                    onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-xs text-muted-foreground">
                    Estado
                  </Label>
                  <select
                    id="state"
                    value={filters.state}
                    onChange={(e) => onFiltersChange({ ...filters, state: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Todos os estados</option>
                    {brazilianStates.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4 border-b border-border pb-4">
            <button
              className="flex w-full items-center justify-between py-2"
              onClick={() => toggleSection('price')}
            >
              <span className="text-sm font-medium">Faixa de Preço</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedSections.includes('price') ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.includes('price') && (
              <div className="mt-3 flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="priceMin" className="text-xs text-muted-foreground">
                    Mínimo
                  </Label>
                  <Input
                    id="priceMin"
                    type="number"
                    placeholder="R$ 0"
                    value={filters.priceMin}
                    onChange={(e) => onFiltersChange({ ...filters, priceMin: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="priceMax" className="text-xs text-muted-foreground">
                    Máximo
                  </Label>
                  <Input
                    id="priceMax"
                    type="number"
                    placeholder="R$ 5000"
                    value={filters.priceMax}
                    onChange={(e) => onFiltersChange({ ...filters, priceMax: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mb-4 border-b border-border pb-4">
            <button
              className="flex w-full items-center justify-between py-2"
              onClick={() => toggleSection('stars')}
            >
              <span className="text-sm font-medium">Classificação</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedSections.includes('stars') ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.includes('stars') && (
              <div className="mt-3 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <label key={star} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-muted">
                    <Checkbox
                      checked={filters.stars.includes(star)}
                      onCheckedChange={() => handleStarsToggle(star)}
                    />
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: star }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {star} {star === 1 ? 'estrela' : 'estrelas'}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4 border-b border-border pb-4">
            <button
              className="flex w-full items-center justify-between py-2"
              onClick={() => toggleSection('rating')}
            >
              <span className="text-sm font-medium">Avaliação Mínima</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedSections.includes('rating') ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.includes('rating') && (
              <div className="mt-3 space-y-2">
                {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                  <label key={rating} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-muted">
                    <input
                      type="radio"
                      name="minRating"
                      value={rating}
                      checked={filters.minRating === String(rating)}
                      onChange={(e) => onFiltersChange({ ...filters, minRating: e.target.value })}
                      className="h-4 w-4 accent-primary"
                    />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{rating}+ </span>
                    <span className="text-xs text-muted-foreground">
                      {rating >= 4.5 ? 'Excelente' : rating >= 4 ? 'Muito bom' : rating >= 3.5 ? 'Bom' : 'Razoável'}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="pb-4">
            <button
              className="flex w-full items-center justify-between py-2"
              onClick={() => toggleSection('amenities')}
            >
              <span className="text-sm font-medium">Comodidades</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedSections.includes('amenities') ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.includes('amenities') && (
              <div className="mt-3 space-y-2">
                {amenityOptions.map((amenity) => (
                  <label
                    key={amenity.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-muted"
                  >
                    <Checkbox
                      checked={filters.amenities.includes(amenity.value)}
                      onCheckedChange={() => handleAmenityToggle(amenity.value)}
                    />
                    <span className="text-muted-foreground">{amenity.icon}</span>
                    <span className="text-sm">{amenity.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex gap-2 lg:hidden">
              <Button variant="outline" className="flex-1" onClick={onClearFilters}>
                Limpar Filtros
              </Button>
              <Button className="flex-1" onClick={() => setIsOpen(false)}>
                Aplicar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
