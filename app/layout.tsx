import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
})

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair'
})

export const metadata: Metadata = {
  title: 'Viajei | Encontre o Hotel Perfeito para sua Viagem',
  description: 'Compare preços, veja avaliações e reserve hotéis em todo o Brasil. Encontre as melhores ofertas em pousadas, resorts e hotéis de luxo.',
  keywords: ['hotéis', 'reservas', 'hospedagem', 'viagem', 'pousadas', 'resorts', 'Brasil'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
