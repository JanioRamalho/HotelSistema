'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, User, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-xl font-bold text-foreground">StayHub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link 
            href="/" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Buscar Hotéis
          </Link>
          <Link 
            href="#destinos" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Destinos Populares
          </Link>
          <Link 
            href="#ofertas" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ofertas
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="icon" aria-label="Favoritos">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <Link href="/login">
              <User className="h-4 w-4" />
              Entrar
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/cadastro">Cadastrar</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="container mx-auto flex flex-col gap-4 px-4 py-4">
            <Link 
              href="/" 
              className="text-sm font-medium text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Buscar Hotéis
            </Link>
            <Link 
              href="#destinos" 
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Destinos Populares
            </Link>
            <Link 
              href="#ofertas" 
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ofertas
            </Link>
            <hr className="border-border" />
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="justify-start gap-2">
                <Heart className="h-4 w-4" />
                Favoritos
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                <Link href="/login">
                  <User className="h-4 w-4" />
                  Entrar
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/cadastro">Cadastrar</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
