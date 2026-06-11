import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MyBookingsClient } from './my-bookings-client'

export const metadata = {
  title: 'Minhas reservas | Viajei',
  description: 'Acompanhe suas reservas demo no Viajei',
}

export default function MyBookingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MyBookingsClient />
      <Footer />
    </div>
  )
}
