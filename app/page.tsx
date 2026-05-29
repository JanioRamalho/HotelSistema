import { Header } from '@/components/header'
import { HeroSection } from '@/components/hero-section'
import { PopularDestinations } from '@/components/popular-destinations'
import { PromotionsSection } from '@/components/promotions-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { FaqSection } from '@/components/faq-section'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <PopularDestinations />
      <PromotionsSection />
      <TestimonialsSection />
      <FaqSection />
      <Footer />
    </main>
  )
}
