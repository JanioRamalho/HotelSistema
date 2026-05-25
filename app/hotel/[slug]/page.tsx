import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { HotelDetailLoader } from './hotel-detail-loader'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params

  return {
    title: `${slug.replaceAll('-', ' ')} | Viajei`,
    description: 'Detalhes do hotel no Viajei',
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
