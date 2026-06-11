'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, CheckCircle2, Loader2, LogIn, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchHotelBySlug } from '@/features/hotels/hotel-api-client'
import { Hotel, Room } from '@/features/hotels/hotel-types'
import { createDemoBooking, DemoWallet, fetchDemoWallet, HotelSession } from '@/features/hotels/hotel-experience-api'

const sessionStorageKey = 'hotel-sistema-session-user'

function readSession(): HotelSession | null {
  const raw = window.localStorage.getItem(sessionStorageKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as HotelSession
    return parsed?.user && parsed?.token ? parsed : null
  } catch {
    window.localStorage.removeItem(sessionStorageKey)
    return null
  }
}

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0
  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  const diff = Math.ceil((end.getTime() - start.getTime()) / 86_400_000)
  return Number.isFinite(diff) && diff > 0 ? diff : 0
}

interface Props {
  slug: string
  roomId: string
}

export function RoomBookingClient({ slug, roomId }: Props) {
  const router = useRouter()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [session, setSession] = useState<HotelSession | null>(null)
  const [wallet, setWallet] = useState<DemoWallet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: '1',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestDocument: '',
    guestBirthdate: '',
    guestZipCode: '',
    specialRequests: '',
  })

  useEffect(() => {
    const currentSession = readSession()
    setSession(currentSession)
    if (currentSession) {
      setForm((prev) => ({
        ...prev,
        guestName: currentSession.user.name,
        guestEmail: currentSession.user.email,
      }))
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      try {
        const response = await fetchHotelBySlug(slug, controller.signal)
        const selectedRoom = response.data.rooms.find((item) => item.id === roomId) || null
        setHotel(response.data)
        setRoom(selectedRoom)
        setForm((prev) => ({ ...prev, guests: String(Math.min(selectedRoom?.capacity || 1, 2)) }))
      } catch (error) {
        if (controller.signal.aborted) return
        setMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar o quarto.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [slug, roomId])

  useEffect(() => {
    if (!session) return
    const controller = new AbortController()

    fetchDemoWallet(session.token, controller.signal)
      .then(setWallet)
      .catch(() => setWallet(null))

    return () => controller.abort()
  }, [session])

  const nights = useMemo(() => nightsBetween(form.checkIn, form.checkOut), [form.checkIn, form.checkOut])
  const total = room ? room.price * nights : 0
  const totalCents = total * 100
  const walletBalance = wallet ? wallet.balance_cents / 100 : 0
  const hasEnoughBalance = Boolean(wallet && wallet.balance_cents >= totalCents)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!hotel || !room || !session) return

    if (nights <= 0) {
      setStatus('error')
      setMessage('Escolha datas validas para calcular as diarias.')
      return
    }

    if (!form.guestName || !form.guestEmail || !form.guestPhone || !form.guestDocument || !form.guestBirthdate) {
      setStatus('error')
      setMessage('Preencha os dados do hospede para concluir a reserva.')
      return
    }

    if (!hasEnoughBalance) {
      setStatus('error')
      setMessage('Saldo demo insuficiente para concluir esta reserva.')
      return
    }

    setStatus('submitting')
    setMessage('')

    try {
      const result = await createDemoBooking({
        hotel: {
          id: hotel.id,
          name: hotel.name,
          slug: hotel.slug,
          description: hotel.description,
          shortDescription: hotel.shortDescription,
          address: hotel.address,
          city: hotel.city,
          state: hotel.state,
          country: hotel.country,
          zipCode: hotel.zipCode,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          stars: hotel.stars,
          rating: hotel.rating,
          reviewCount: hotel.reviewCount,
          priceFrom: hotel.priceFrom,
          policies: hotel.policies,
          contact: hotel.contact,
        },
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          category: room.category,
          price: room.price,
          capacity: room.capacity,
          size: room.size,
        },
        roomId: room.id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests),
        guestName: form.guestName,
        guestEmail: form.guestEmail,
        guestPhone: form.guestPhone,
        guestDocument: form.guestDocument,
        guestBirthdate: form.guestBirthdate,
        guestZipCode: form.guestZipCode,
        specialRequests: form.specialRequests,
      }, session.token)
      setStatus('success')
      setMessage(`Reserva confirmada. Saldo restante: R$ ${(result.data.remainingBalanceCents / 100).toLocaleString('pt-BR')}.`)
      setTimeout(() => router.push('/minhas-reservas'), 900)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel criar a reserva.')
    }
  }

  if (isLoading) {
    return <main className="container mx-auto min-h-[60vh] px-4 py-10 text-sm text-muted-foreground">Carregando quarto...</main>
  }

  if (!hotel || !room) {
    return (
      <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-2xl font-bold">Quarto nao encontrado</h1>
        <p className="mb-6 text-muted-foreground">{message || 'Nao encontramos este quarto para o hotel selecionado.'}</p>
        <Button asChild>
          <Link href={`/hotel/${slug}`}>Voltar ao hotel</Link>
        </Button>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <LogIn className="mb-4 h-10 w-10 text-primary" />
        <h1 className="mb-2 text-2xl font-bold">Entre para reservar</h1>
        <p className="mb-6 max-w-md text-muted-foreground">Voce precisa estar logado para usar a carteira demo e confirmar a reserva deste quarto.</p>
        <Button asChild>
          <Link href={`/login?redirect=${encodeURIComponent(`/hotel/${slug}/quarto/${roomId}`)}`}>Ir para login</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href={`/hotel/${hotel.slug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Voltar para {hotel.name}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <div className="mb-5 overflow-hidden rounded-xl border border-border bg-card">
            <div className="relative aspect-video">
              <Image src={room.images[0] || hotel.images[0]?.url} alt={room.name} fill className="object-cover" priority />
            </div>
            <div className="p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{hotel.city} - {hotel.state}</Badge>
                <Badge variant="outline">Ate {room.capacity} hospedes</Badge>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{room.name}</h1>
              <p className="mt-2 text-muted-foreground">{room.description}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Dados da hospedagem</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Check-in</span>
                <input type="date" className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.checkIn} onChange={(event) => setForm((prev) => ({ ...prev, checkIn: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Check-out</span>
                <input type="date" className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.checkOut} onChange={(event) => setForm((prev) => ({ ...prev, checkOut: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Hospedes</span>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.guests} onChange={(event) => setForm((prev) => ({ ...prev, guests: event.target.value }))}>
                  {Array.from({ length: room.capacity }).map((_, index) => {
                    const value = index + 1
                    return <option key={value} value={value}>{value}</option>
                  })}
                </select>
              </label>
            </div>

            <h2 className="text-lg font-semibold">Dados do hospede</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Nome completo</span>
                <input className="h-10 w-full rounded-md border border-input bg-background px-3" placeholder="Ex: Maria Silva" value={form.guestName} onChange={(event) => setForm((prev) => ({ ...prev, guestName: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">E-mail</span>
                <input className="h-10 w-full rounded-md border border-input bg-background px-3" placeholder="Ex: maria@email.com" value={form.guestEmail} onChange={(event) => setForm((prev) => ({ ...prev, guestEmail: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Telefone</span>
                <input className="h-10 w-full rounded-md border border-input bg-background px-3" placeholder="Com DDD, somente numeros" value={form.guestPhone} onChange={(event) => setForm((prev) => ({ ...prev, guestPhone: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">CPF</span>
                <input className="h-10 w-full rounded-md border border-input bg-background px-3" placeholder="Somente numeros" value={form.guestDocument} onChange={(event) => setForm((prev) => ({ ...prev, guestDocument: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Data de nascimento</span>
                <input type="date" className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.guestBirthdate} onChange={(event) => setForm((prev) => ({ ...prev, guestBirthdate: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">CEP</span>
                <input className="h-10 w-full rounded-md border border-input bg-background px-3" placeholder="Opcional, somente numeros" value={form.guestZipCode} onChange={(event) => setForm((prev) => ({ ...prev, guestZipCode: event.target.value }))} />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Pedidos especiais</span>
              <textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2" placeholder="Ex: quarto silencioso, cama extra, toalhas adicionais" value={form.specialRequests} onChange={(event) => setForm((prev) => ({ ...prev, specialRequests: event.target.value }))} />
            </label>

            {message && status !== 'idle' && (
              <div className={`rounded-lg p-3 text-sm ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                {message}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={status === 'submitting' || !hasEnoughBalance || nights <= 0}>
              {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" />}
              Pagar com saldo demo
            </Button>
          </form>
        </section>

        <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 text-lg font-semibold">Resumo da reserva</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Diaria</span>
              <strong>R$ {room.price.toLocaleString('pt-BR')}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Noites</span>
              <strong>{nights}</strong>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-base">
              <span>Total</span>
              <strong>R$ {total.toLocaleString('pt-BR')}</strong>
            </div>
            <div className="mt-4 rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Carteira demo
              </div>
              <p className="mt-1 text-xl font-bold">R$ {walletBalance.toLocaleString('pt-BR')}</p>
              {hasEnoughBalance ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-green-700"><CheckCircle2 className="h-3 w-3" /> Saldo suficiente</p>
              ) : (
                <p className="mt-1 text-xs text-destructive">Saldo insuficiente para este total.</p>
              )}
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-muted-foreground">
              <CalendarDays className="mt-0.5 h-4 w-4" />
              A reserva aparece em Minhas reservas apos a confirmacao.
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
