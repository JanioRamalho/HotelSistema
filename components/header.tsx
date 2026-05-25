'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Heart, LogOut, Menu, Settings, User, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { HotelSessionUser } from '@/features/hotels/hotel-experience-api'

const sessionStorageKey = 'hotel-sistema-session-user'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [sessionUser, setSessionUser] = useState<HotelSessionUser | null>(null)

  useEffect(() => {
    const storedUser = window.localStorage.getItem(sessionStorageKey)

    if (!storedUser) return

    try {
      setSessionUser(JSON.parse(storedUser) as HotelSessionUser)
    } catch {
      window.localStorage.removeItem(sessionStorageKey)
    }
  }, [])

  const firstName = useMemo(() => {
    return sessionUser?.name?.trim().split(/\s+/)[0] || ''
  }, [sessionUser])

  const initials = useMemo(() => {
    if (!sessionUser?.name) return 'U'
    return sessionUser.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }, [sessionUser])

  const handleLogout = () => {
    window.localStorage.removeItem(sessionStorageKey)
    setSessionUser(null)
    setAccountMenuOpen(false)
    setMobileMenuOpen(false)
  }

  const accountMenuItems = [
    { label: 'Minhas reservas', icon: CalendarCheck, href: '/minhas-reservas' },
    { label: 'Dados cadastrais', icon: UserRound, href: '/minha-conta' },
    { label: 'Favoritos', icon: Heart, href: '/favoritos' },
    { label: 'Configurações', icon: Settings, href: '/configuracoes' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-xl font-bold text-foreground">Viajei</span>
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
          {sessionUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 transition-colors hover:bg-muted"
                aria-expanded={accountMenuOpen}
                aria-label="Abrir menu da conta"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </div>
                <span className="text-sm font-medium text-foreground">Olá, {firstName}</span>
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                  <div className="border-b border-border px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{sessionUser.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{sessionUser.email}</p>
                  </div>

                  <div className="py-1">
                    {accountMenuItems.map((item) => {
                      const Icon = item.icon

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="gap-2" asChild>
                <Link href="/login">
                  <User className="h-4 w-4" />
                  Entrar
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
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
              {sessionUser ? (
                <div className="rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-2 border-b border-border p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Olá, {firstName}</p>
                      <p className="truncate text-xs text-muted-foreground">{sessionUser.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col py-1">
                    {accountMenuItems.map((item) => {
                      const Icon = item.icon

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      )
                    })}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2 border-t border-border px-3 py-2 text-left text-sm text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                    <Link href="/login">
                      <User className="h-4 w-4" />
                      Entrar
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/cadastro">Cadastrar</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
