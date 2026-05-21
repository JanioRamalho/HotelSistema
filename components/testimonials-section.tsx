'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Mariana Silva',
    location: 'São Paulo, SP',
    rating: 5,
    text: 'Encontrei o hotel perfeito para minha lua de mel! O processo de reserva foi super simples e o preço estava ótimo. Recomendo muito a StayHub!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    hotel: 'Resort Praia do Forte, BA',
  },
  {
    id: 2,
    name: 'Carlos Eduardo',
    location: 'Rio de Janeiro, RJ',
    rating: 5,
    text: 'Uso a StayHub para todas as minhas viagens de trabalho. A variedade de hotéis e os filtros de busca facilitam muito encontrar o que preciso rapidamente.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    hotel: 'Hotel Urbano São Paulo',
  },
  {
    id: 3,
    name: 'Ana Beatriz Ferreira',
    location: 'Belo Horizonte, MG',
    rating: 5,
    text: 'Viajamos com as crianças e consegui filtrar facilmente hotéis com kids club. A descrição era exata e as crianças não queriam ir embora!',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    hotel: 'Beach Resort Fortaleza',
  },
  {
    id: 4,
    name: 'Roberto Mendes',
    location: 'Curitiba, PR',
    rating: 5,
    text: 'Melhor plataforma de reservas! Consegui comparar vários hotéis lado a lado e escolher o melhor custo-benefício. O suporte também é excelente.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    hotel: 'Pousada Serra Gaúcha',
  },
  {
    id: 5,
    name: 'Fernanda Costa',
    location: 'Salvador, BA',
    rating: 5,
    text: 'Adoro poder filtrar por comodidades! Achei facilmente um hotel pet-friendly para levar meu cachorro na viagem. Super prático!',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
    hotel: 'Pousada Vila do Mar, Búzios',
  },
]

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
  }

  const current = testimonials[currentIndex]

  return (
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="mb-3 font-serif text-3xl font-bold text-foreground sm:text-4xl">
            O Que Nossos Clientes Dizem
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-pretty">
            Milhares de viajantes já encontraram a hospedagem perfeita através da StayHub
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="relative rounded-2xl bg-card p-8 shadow-lg md:p-12">
            <div className="absolute -top-6 left-8 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Quote className="h-6 w-6 text-primary-foreground" />
            </div>

            <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-secondary">
                  <Image
                    src={current.avatar}
                    alt={current.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="mb-4 flex items-center justify-center gap-1 md:justify-start">
                  {[...Array(current.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <blockquote className="mb-6 text-lg leading-relaxed text-foreground md:text-xl">
                  &ldquo;{current.text}&rdquo;
                </blockquote>

                <div>
                  <p className="font-semibold text-foreground">{current.name}</p>
                  <p className="text-sm text-muted-foreground">{current.location}</p>
                  <p className="mt-1 text-xs text-primary">Hospedou-se em: {current.hotel}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={prevTestimonial}
                className="rounded-full border border-border p-2 transition-colors hover:bg-muted"
                aria-label="Depoimento anterior"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>

              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-6 bg-primary'
                        : 'w-2.5 bg-border hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Ir para depoimento ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="rounded-full border border-border p-2 transition-colors hover:bg-muted"
                aria-label="Próximo depoimento"
              >
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
