import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ShieldCheck, Lock, CreditCard } from 'lucide-react'

const footerLinks = {
  navegacao: [
    { label: 'Buscar Hotéis', href: '/busca' },
    { label: 'Cadastrar', href: '/cadastro' },
    { label: 'Entrar', href: '/login' },
    { label: 'Destinos Populares', href: '/busca' },
  ],
  suporte: [
    { label: 'Central de Ajuda', href: '/ajuda' },
    { label: 'Cancelamento de Reservas', href: '/cancelamento' },
    { label: 'Formas de Pagamento', href: '/contato' },
    { label: 'Contato', href: '/contato' },
  ],
  legal: [
    { label: 'Termos de Uso', href: '/termos' },
    { label: 'Política de Privacidade', href: '/privacidade' },
    { label: 'Política de Cookies', href: '/cookies' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: '/contato', label: 'Facebook' },
  { icon: Instagram, href: '/contato', label: 'Instagram' },
  { icon: Twitter, href: '/contato', label: 'Twitter' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-3" aria-label="Viajei.com">
              <span className="text-xl font-black tracking-tight text-foreground md:text-2xl">Viajei.com</span>
            </Link>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground text-pretty leading-relaxed">
              Sua plataforma de reservas de hotéis em todo o Brasil. Compare preços, veja avaliações e reserve com segurança.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Navegação</h4>
            <ul className="space-y-2">
              {footerLinks.navegacao.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Suporte</h4>
            <ul className="space-y-2">
              {footerLinks.suporte.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                contato@viajei.com
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                0800 123 4567
              </p>
            </div>
          </div>
        </div>

        {/* Security Badges */}
        <div className="mt-10 border-t border-border pt-8">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-5 w-5 text-secondary" />
              <span className="text-sm">Site Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5 text-secondary" />
              <span className="text-sm">SSL 256-bit</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-5 w-5 text-secondary" />
              <span className="text-sm">Pagamento Seguro</span>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              &copy; {new Date().getFullYear()} Viajei Tecnologia Ltda. CNPJ: 00.000.000/0001-00. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Visa.svg/200px-Visa.svg.png"
                alt="Visa"
                className="h-5 object-contain opacity-50 grayscale"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png"
                alt="Mastercard"
                className="h-5 object-contain opacity-50 grayscale"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png"
                alt="PayPal"
                className="h-5 object-contain opacity-50 grayscale"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Pix_logo.svg/200px-Pix_logo.svg.png"
                alt="Pix"
                className="h-5 object-contain opacity-50 grayscale"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
