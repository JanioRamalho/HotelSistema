'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  {
    question: 'Como faço uma reserva na StayHub?',
    answer: 'É muito simples! Basta pesquisar o destino desejado, selecionar as datas de check-in e check-out, escolher o hotel que mais lhe agrada e clicar em "Reservar". Você será guiado pelo processo de pagamento seguro e receberá a confirmação por e-mail.'
  },
  {
    question: 'Posso cancelar ou modificar minha reserva?',
    answer: 'Sim! Cada hotel possui sua própria política de cancelamento, que é exibida antes da confirmação da reserva. A maioria oferece cancelamento gratuito até determinado prazo. Para modificar ou cancelar, acesse "Minhas Reservas" na sua conta.'
  },
  {
    question: 'Os preços incluem todas as taxas?',
    answer: 'Sim, todos os preços exibidos na StayHub incluem impostos e taxas de serviço. Não há custos ocultos. Algumas propriedades podem cobrar taxas extras no local (como taxa de resort ou estacionamento), mas isso é sempre informado claramente antes da reserva.'
  },
  {
    question: 'Como funciona o filtro de comodidades?',
    answer: 'Nosso sistema de filtros permite que você selecione as comodidades que são importantes para você, como Wi-Fi, piscina, academia, pet-friendly, spa, entre outras. Apenas hotéis que possuem TODAS as comodidades selecionadas serão exibidos nos resultados.'
  },
  {
    question: 'Os hotéis aceitam pets?',
    answer: 'Alguns hotéis são pet-friendly! Use o filtro "Pet Friendly" na busca para encontrar hospedagens que aceitam seu animal de estimação. Recomendamos sempre verificar as políticas específicas do hotel sobre peso, quantidade e tipos de pets aceitos.'
  },
  {
    question: 'Como posso entrar em contato com o suporte?',
    answer: 'Nossa equipe de suporte está disponível 24 horas por dia, 7 dias por semana. Você pode nos contatar pelo telefone 0800 123 4567, pelo chat no site, ou pelo e-mail contato@stayhub.com.br. Estamos sempre prontos para ajudar!'
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="mb-3 font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Perguntas Frequentes
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-pretty">
            Tire suas dúvidas sobre como usar a StayHub para encontrar e reservar hotéis
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border-b border-border"
            >
              <button
                className="flex w-full items-center justify-between py-5 text-left"
                onClick={() => toggleFaq(index)}
                aria-expanded={openIndex === index}
              >
                <span className="flex items-center gap-3 pr-4 font-medium text-foreground">
                  <HelpCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="pb-5 pl-8">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
