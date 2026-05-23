import { hotels } from '@/features/hotels/hotel-data'
import { getHotelBySlug } from '@/features/hotels/hotel-service'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { HotelDetailLoader } from './hotel-detail-loader'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return hotels.map((hotel) => ({
    slug: hotel.slug,
  }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const hotel = getHotelBySlug(slug)
  
  if (!hotel) {
    return { title: 'Hotel não encontrado' }
  }

  return {
    title: `${hotel.name} | StayHub`,
    description: hotel.shortDescription,
  }
}

export default async function HotelPage({ params }: Props) {
  const { slug } = await params

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HotelDetailLoader slug={slug} />
      <Footer />
    </div>
  )
}
