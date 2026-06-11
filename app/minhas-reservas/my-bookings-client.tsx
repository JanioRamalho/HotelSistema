'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarCheck, Loader2, LogIn, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cancelDemoBooking, DemoBooking, DemoWallet, fetchDemoBookings, fetchDemoWallet, HotelSession } from '@/features/hotels/hotel-experience-api'

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

function statusLabel(status: string) {
  switch (status) {
    case 'confirmed':
      return 'Confirmada'
    case 'cancelled':
      return 'Cancelada'
    case 'pending':
      return 'Pendente'
    default:
      return status
  }
}

export function MyBookingsClient() {
  const [session, setSession] = useState<HotelSession | null>(null)
  const [wallet, setWallet] = useState<DemoWallet | null>(null)
  const [bookings, setBookings] = useState<DemoBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const activeBookings = useMemo(() => bookings.filter((booking) => booking.status !== 'cancelled'), [bookings])

  async function loadAccountData(currentSession: HotelSession) {
    const [walletData, bookingData] = await Promise.all([
      fetchDemoWallet(currentSession.token),
      fetchDemoBookings(currentSession.token),
    ])
    setWallet(walletData)
    setBookings(bookingData)
  }

  useEffect(() => {
    const currentSession = readSession()
    setSession(currentSession)

    if (!currentSession) {
      setIsLoading(false)
      return
    }

    loadAccountData(currentSession)
      .catch(() => setMessage('Nao foi possivel carregar suas reservas.'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleCancel = async (bookingId: string) => {
    if (!session) return
    setCancelingId(bookingId)
    setMessage('')

    try {
      const result = await cancelDemoBooking(bookingId, session.token)
      await loadAccountData(session)
      setMessage(`Reserva cancelada. Estorno: R$ ${(result.refundedCents / 100).toLocaleString('pt-BR')}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel cancelar a reserva.')
    } finally {
      setCancelingId(null)
    }
  }

  if (!session) {
    return (
      <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <LogIn className="mb-4 h-10 w-10 text-primary" />
        <h1 className="mb-2 text-2xl font-bold">Entre para ver suas reservas</h1>
        <p className="mb-6 max-w-md text-muted-foreground">As reservas demo ficam vinculadas ao seu login e a sua carteira.</p>
        <Button asChild>
          <Link href={`/login?redirect=${encodeURIComponent('/minhas-reservas')}`}>Ir para login</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas reservas</h1>
          <p className="mt-2 text-muted-foreground">Acompanhe suas reservas demo e cancele quando precisar.</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" />
            Saldo demo
          </div>
          <p className="text-xl font-bold">R$ {((wallet?.balance_cents || 0) / 100).toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {message && (
        <div className="mb-5 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando reservas...
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <CalendarCheck className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Nenhuma reserva ainda</h2>
          <p className="mb-5 text-muted-foreground">Escolha um hotel e reserve um quarto usando sua carteira demo.</p>
          <Button asChild>
            <Link href="/busca">Buscar hoteis</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isCancelled = booking.status === 'cancelled'

            return (
              <article key={booking.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={isCancelled ? 'outline' : 'secondary'}>{statusLabel(booking.status)}</Badge>
                      <span className="text-xs text-muted-foreground">Reserva {booking.id.slice(0, 8)}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">{booking.hotel_name}</h2>
                    <p className="text-muted-foreground">{booking.room_name}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {new Date(booking.check_in).toLocaleDateString('pt-BR')} ate {new Date(booking.check_out).toLocaleDateString('pt-BR')} · {booking.guests} hospede{booking.guests === 1 ? '' : 's'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Hospede: {booking.guest_name} · {booking.guest_email}</p>
                  </div>
                  <div className="min-w-48 text-left lg:text-right">
                    <p className="text-sm text-muted-foreground">Total pago</p>
                    <p className="text-2xl font-bold">R$ {booking.total_price.toLocaleString('pt-BR')}</p>
                    {!isCancelled && (
                      <Button variant="outline" className="mt-3" disabled={cancelingId === booking.id} onClick={() => handleCancel(booking.id)}>
                        {cancelingId === booking.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        Cancelar reserva
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {activeBookings.length > 0 && (
        <p className="mt-5 text-sm text-muted-foreground">
          Reservas canceladas permanecem no historico para consulta.
        </p>
      )}
    </main>
  )
}
