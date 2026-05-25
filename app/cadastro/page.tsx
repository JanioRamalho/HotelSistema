'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Eye, EyeOff, Mail, Lock, User, Phone, Calendar, 
  MapPin, ArrowLeft, Check, KeyRound, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { confirmPasswordRegister, registerWithPassword } from '@/features/hotels/hotel-experience-api'

interface FormData {
  // Dados pessoais
  nomeCompleto: string
  email: string
  cpf: string
  dataNascimento: string
  telefone: string
  genero: string
  
  // Endereço
  cep: string
  estado: string
  cidade: string
  
  // Conta
  senha: string
  confirmarSenha: string
  
  // Termos
  aceitaTermos: boolean
  aceitaNewsletter: boolean
}

const estadosBrasileiros = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function CadastroPage() {
  // Aba de autenticacao: esta tela cria a conta por e-mail e senha
  // antes do usuario entrar e liberar a carteira demo.
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [verificationCode, setVerificationCode] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [generalError, setGeneralError] = useState('')
  
  const [formData, setFormData] = useState<FormData>({
    nomeCompleto: '',
    email: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    genero: '',
    cep: '',
    estado: '',
    cidade: '',
    senha: '',
    confirmarSenha: '',
    aceitaTermos: false,
    aceitaNewsletter: false
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1')
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nomeCompleto.trim()) {
      newErrors.nomeCompleto = 'Nome completo é obrigatório'
    } else if (formData.nomeCompleto.trim().split(' ').length < 2) {
      newErrors.nomeCompleto = 'Informe nome e sobrenome'
    }

    if (!formData.email) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }

    if (!formData.cpf) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF inválido'
    }

    if (!formData.dataNascimento) {
      newErrors.dataNascimento = 'Data de nascimento é obrigatória'
    } else {
      const birthDate = new Date(formData.dataNascimento)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 18) {
        newErrors.dataNascimento = 'Você precisa ter 18 anos ou mais'
      }
    }

    if (!formData.telefone) {
      newErrors.telefone = 'Telefone é obrigatório'
    } else if (formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória'
    } else if (formData.senha.length < 8) {
      newErrors.senha = 'Senha deve ter no mínimo 8 caracteres'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.senha)) {
      newErrors.senha = 'Senha deve conter letras maiúsculas, minúsculas e números'
    }

    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirme sua senha'
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem'
    }

    if (!formData.aceitaTermos) {
      newErrors.aceitaTermos = 'Você precisa aceitar os termos de uso'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep2()) return

    setIsLoading(true)
    setLoadingMessage('Validando seus dados e enviando o codigo...')
    setErrors({})
    setGeneralError('')

    try {
      await registerWithPassword({
        name: formData.nomeCompleto,
        email: formData.email,
        password: formData.senha,
        phone: formData.telefone,
        document: formData.cpf,
        birthdate: formData.dataNascimento,
        zipCode: formData.cep,
      })
      setPendingEmail(formData.email)
      setFeedbackMessage('Enviamos um codigo para seu e-mail. Confirme para concluir o cadastro.')
      setCurrentStep(3)
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Nao foi possivel criar a conta.')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault()

    if (verificationCode.length !== 6 || !pendingEmail) {
      setErrors({ codigo: 'Informe o codigo de 6 digitos enviado ao seu e-mail.' })
      return
    }

    setIsLoading(true)
    setLoadingMessage('Conferindo o codigo...')
    setErrors({})
    setGeneralError('')

    try {
      await confirmPasswordRegister(pendingEmail, verificationCode)
      router.push(`/login?cadastro=verificar&email=${encodeURIComponent(pendingEmail)}`)
    } catch (error) {
      setErrors({
        codigo: error instanceof Error ? error.message : 'Nao foi possivel confirmar o cadastro.',
      })
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  const passwordStrength = () => {
    const { senha } = formData
    if (!senha) return { level: 0, text: '', color: '' }
    
    let strength = 0
    if (senha.length >= 8) strength++
    if (/[a-z]/.test(senha)) strength++
    if (/[A-Z]/.test(senha)) strength++
    if (/\d/.test(senha)) strength++
    if (/[^a-zA-Z\d]/.test(senha)) strength++

    if (strength <= 2) return { level: strength, text: 'Fraca', color: 'bg-destructive' }
    if (strength <= 3) return { level: strength, text: 'Média', color: 'bg-yellow-500' }
    return { level: strength, text: 'Forte', color: 'bg-green-500' }
  }

  const strength = passwordStrength()

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Imagem */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080)'
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
          
          <div className="space-y-8">
            <h1 className="text-4xl font-serif font-bold leading-tight text-balance">
              Crie sua conta e comece a explorar
            </h1>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <p className="text-white/90">Acesse ofertas exclusivas e descontos especiais</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <p className="text-white/90">Salve seus hotéis favoritos e compare preços</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <p className="text-white/90">Gerencie suas reservas em um só lugar</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/70">
            Junte-se a mais de 2 milhões de viajantes
          </p>
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-16 xl:px-20 bg-background overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">Viajei</span>
            </Link>
          </div>

          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
              currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 rounded ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
              currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <div className={`flex-1 h-1 rounded ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
              currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {currentStep === 1 ? 'Dados Pessoais' : currentStep === 2 ? 'Criar Senha' : 'Verificar E-mail'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {currentStep === 1 
                ? 'Preencha suas informações para criar sua conta' 
                : currentStep === 2
                  ? 'Crie uma senha segura para proteger sua conta'
                  : 'Digite o codigo enviado para concluir seu cadastro'}
            </p>
          </div>

          <form onSubmit={currentStep === 3 ? handleConfirmRegistration : handleSubmit} className="space-y-4">
            {loadingMessage && (
              <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                {loadingMessage}
              </div>
            )}

            {generalError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {generalError}
              </div>
            )}

            {currentStep === 1 && (
              <>
                {/* Nome Completo */}
                <div className="space-y-1.5">
                  <Label htmlFor="nomeCompleto">
                    Nome Completo <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nomeCompleto"
                      type="text"
                      placeholder="Seu nome completo"
                      className={`pl-10 ${errors.nomeCompleto ? 'border-destructive' : ''}`}
                      value={formData.nomeCompleto}
                      onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                    />
                  </div>
                  {errors.nomeCompleto && (
                    <p className="text-xs text-destructive">{errors.nomeCompleto}</p>
                  )}
                </div>

                {/* E-mail */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    E-mail <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                {/* CPF e Data de Nascimento */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cpf">
                      CPF <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      className={errors.cpf ? 'border-destructive' : ''}
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      maxLength={14}
                    />
                    {errors.cpf && (
                      <p className="text-xs text-destructive">{errors.cpf}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dataNascimento">
                      Data de Nascimento <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dataNascimento"
                        type="date"
                        className={`pl-10 ${errors.dataNascimento ? 'border-destructive' : ''}`}
                        value={formData.dataNascimento}
                        onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                      />
                    </div>
                    {errors.dataNascimento && (
                      <p className="text-xs text-destructive">{errors.dataNascimento}</p>
                    )}
                  </div>
                </div>

                {/* Telefone e Gênero */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="telefone">
                      Telefone/Celular <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="telefone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        className={`pl-10 ${errors.telefone ? 'border-destructive' : ''}`}
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                        maxLength={15}
                      />
                    </div>
                    {errors.telefone && (
                      <p className="text-xs text-destructive">{errors.telefone}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="genero">Gênero</Label>
                    <Select
                      value={formData.genero}
                      onValueChange={(value) => setFormData({ ...formData, genero: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                        <SelectItem value="prefiro-nao-dizer">Prefiro não dizer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Endereço - Opcional */}
                <div className="pt-2">
                  <p className="text-sm font-medium text-foreground mb-3">
                    Endereço <span className="text-muted-foreground font-normal">(opcional)</span>
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        type="text"
                        placeholder="00000-000"
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                        maxLength={9}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="estado">Estado</Label>
                      <Select
                        value={formData.estado}
                        onValueChange={(value) => setFormData({ ...formData, estado: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {estadosBrasileiros.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cidade">Cidade</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cidade"
                          type="text"
                          placeholder="Cidade"
                          className="pl-10"
                          value={formData.cidade}
                          onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="button" 
                  className="w-full mt-4" 
                  size="lg"
                  onClick={handleNextStep}
                >
                  Continuar
                </Button>
              </>
            )}

            {currentStep === 2 && (
              <>
                {/* Senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="senha">
                    Senha <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      className={`pl-10 pr-10 ${errors.senha ? 'border-destructive' : ''}`}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password strength indicator */}
                  {formData.senha && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div 
                            key={i} 
                            className={`h-1 flex-1 rounded-full ${
                              i <= strength.level ? strength.color : 'bg-muted'
                            }`} 
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${
                        strength.level <= 2 ? 'text-destructive' : 
                        strength.level <= 3 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        Força da senha: {strength.text}
                      </p>
                    </div>
                  )}
                  
                  {errors.senha && (
                    <p className="text-xs text-destructive">{errors.senha}</p>
                  )}
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmarSenha">
                    Confirmar Senha <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmarSenha"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repita sua senha"
                      className={`pl-10 pr-10 ${errors.confirmarSenha ? 'border-destructive' : ''}`}
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmarSenha && (
                    <p className="text-xs text-destructive">{errors.confirmarSenha}</p>
                  )}
                  {formData.confirmarSenha && formData.senha === formData.confirmarSenha && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> As senhas coincidem
                    </p>
                  )}
                </div>

                {/* Termos */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="aceitaTermos"
                      checked={formData.aceitaTermos}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, aceitaTermos: checked as boolean })
                      }
                      className="mt-0.5"
                    />
                    <Label htmlFor="aceitaTermos" className="text-sm font-normal cursor-pointer leading-tight">
                      Li e aceito os{' '}
                      <Link href="/termos" className="text-primary hover:underline">
                        Termos de Uso
                      </Link>{' '}
                      e a{' '}
                      <Link href="/privacidade" className="text-primary hover:underline">
                        Política de Privacidade
                      </Link>{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                  </div>
                  {errors.aceitaTermos && (
                    <p className="text-xs text-destructive">{errors.aceitaTermos}</p>
                  )}

                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="aceitaNewsletter"
                      checked={formData.aceitaNewsletter}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, aceitaNewsletter: checked as boolean })
                      }
                      className="mt-0.5"
                    />
                    <Label htmlFor="aceitaNewsletter" className="text-sm font-normal cursor-pointer leading-tight">
                      Quero receber ofertas exclusivas e novidades por e-mail
                    </Label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1" 
                    size="lg"
                    onClick={() => setCurrentStep(1)}
                  >
                    Voltar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    size="lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                  {feedbackMessage || `Enviamos um codigo para ${pendingEmail}.`}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="codigo">
                    Codigo de verificacao <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="codigo"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      className={`pl-10 ${errors.codigo ? 'border-destructive' : ''}`}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>
                  {errors.codigo && (
                    <p className="text-xs text-destructive">{errors.codigo}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar cadastro
                </Button>
              </>
            )}
          </form>

          {/* Link para Login */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
