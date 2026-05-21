import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ShieldCheck, Lock, CreditCard } from 'lucide-react'

const footerLinks = {
  navegacao: [
    { label: 'Buscar Hotéis', href: '/busca' },
    { label: 'Destinos Populares', href: '#destinos' },
    { label: 'Ofertas Especiais', href: '#ofertas' },
    { label: 'Minha Conta', href: '#' },
    { label: 'Minhas Reservas', href: '#' },
  ],
  suporte: [
    { label: 'Central de Ajuda', href: '#' },
    { label: 'Cancelamento de Reservas', href: '#' },
    { label: 'Formas de Pagamento', href: '#' },
    { label: 'Acessibilidade', href: '#' },
    { label: 'Trabalhe Conosco', href: '#' },
  ],
  legal: [
    { label: 'Termos de Uso', href: '#' },
    { label: 'Política de Privacidade', href: '#' },
    { label: 'Política de Cookies', href: '#' },
    { label: 'LGPD', href: '#' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">StayHub</span>
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
                contato@stayhub.com.br
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
              &copy; {new Date().getFullYear()} StayHub Tecnologia Ltda. CNPJ: 00.000.000/0001-00. Todos os direitos reservados.
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
