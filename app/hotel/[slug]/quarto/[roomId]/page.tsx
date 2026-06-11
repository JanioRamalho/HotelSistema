import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { RoomBookingClient } from './room-booking-client'

interface Props {
  params: Promise<{ slug: string; roomId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params

  return {
    title: `Reservar quarto | ${slug.replaceAll('-', ' ')} | Viajei`,
    description: 'Reserve seu quarto usando a carteira demo do Viajei',
  }
}

export default async function RoomBookingPage({ params }: Props) {
  const { slug, roomId } = await params

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <RoomBookingClient slug={slug} roomId={roomId} />
      <Footer />
    </div>
  )
}
