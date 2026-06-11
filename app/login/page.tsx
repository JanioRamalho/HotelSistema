'use client'

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginWithPassword } from '@/features/hotels/hotel-experience-api'

const sessionStorageKey = 'hotel-sistema-session-user'

function LoginPageContent() {
  // Aba de autenticacao: esta tela concentra login por e-mail/senha.
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'password' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const redirectTo = useMemo(() => {
    const value = searchParams.get('redirect')
    return value && value.startsWith('/') ? value : '/'
  }, [searchParams])

  useEffect(() => {
    const created = searchParams.get('cadastro')
    const createdEmail = searchParams.get('email')

    if (created === 'verificar') {
      if (createdEmail) {
        setEmail(createdEmail)
        setStatus('idle')
        setMessage('Conta verificada. Agora entre com seu e-mail e senha.')
        return
      }

      setStatus('idle')
      setMessage('Conta verificada. Agora entre com seu e-mail e senha.')
    }
  }, [searchParams])

  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault()
    setStatus('password')
    setMessage('')

    try {
      const session = await loginWithPassword(email, password)
      window.localStorage.setItem(sessionStorageKey, JSON.stringify(session))
      setStatus('success')
      setMessage('Login realizado. Carteira demo liberada na sua conta.')
      router.push(redirectTo)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel entrar com e-mail e senha.')
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden lg:flex lg:w-1/2">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <span className="text-xl font-bold">S</span>
            </div>
            <span className="text-2xl font-bold">Viajei</span>
          </Link>

          <div className="max-w-md space-y-6">
            <h1 className="text-balance font-serif text-4xl font-bold leading-tight">
              Acesse sua conta para reservar com seguranca
            </h1>
            <p className="text-lg text-white/90">
              Entre com e-mail e senha cadastrados para acessar sua carteira demo.
            </p>
          </div>

          <p className="text-sm text-white/70">Carteira demo liberada apos login</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center bg-background px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">Viajei</span>
            </Link>
          </div>

          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o inicio
          </Link>

          <div className="mb-8 space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Entrar na sua conta</h2>
            <p className="text-muted-foreground">
              Use e-mail e senha cadastrados para acessar sua conta.
            </p>
          </div>

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={status === 'password'}>
              {status === 'password' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>

          <div className="mt-8 space-y-5">
            {message && (
              <div
                className={`flex items-start gap-2 rounded-lg p-3 text-sm ${status === 'success'
                    ? 'bg-green-50 text-green-700'
                    : status === 'error'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted text-muted-foreground'
                  }`}
              >
                {status === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>{message}</span>
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Nao tem conta?{' '}
            <Link href="/cadastro" className="font-medium text-primary hover:underline">
              Cadastre-se gratuitamente
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando login...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
