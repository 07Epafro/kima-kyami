'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

interface CheckoutData {
  encomendaId: string
  referencia: string
  valor: number
}

function formatarPreco(v: number) { return `€ ${v.toFixed(2).replace('.', ',')}` }

export default function ConfirmacaoPage() {
  const { clearCart } = useCart()
  const [dados, setDados] = useState<CheckoutData | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('kk-checkout')
      if (raw) {
        const parsed = JSON.parse(raw) as CheckoutData & { email?: string }
        setDados(parsed)
        setEmail(parsed.email ?? null)
      }
    } catch { /* silent */ }

    clearCart()
    sessionStorage.removeItem('kk-checkout')
  }, [clearCart])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16">
      {/* Animated checkmark */}
      <div className="relative w-20 h-20 mb-10">
        <div className="absolute inset-0 rounded-full border-2 border-gold/30 animate-ping" />
        <div className="absolute inset-0 rounded-full border border-gold/50" />
        <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-gold"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" className="animate-kk-fade-up" style={{ animationDelay: '0.2s' }} />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="text-center max-w-md">
        <p
          className="text-[10px] tracking-[0.35em] uppercase text-gold mb-4"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Encomenda Recebida
        </p>

        <h1
          className="text-[clamp(26px,4vw,36px)] font-light text-noir tracking-[0.08em] mb-4"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Obrigada pela tua encomenda.
        </h1>

        {dados && (
          <div className="bg-white border border-noir/10 px-6 py-5 my-8 space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
                Referência
              </span>
              <span className="font-mono text-sm text-noir font-medium">{dados.referencia}</span>
            </div>
            <div className="flex justify-between items-center border-t border-noir/8 pt-3">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
                Total
              </span>
              <span className="text-sm text-noir" style={{ fontFamily: 'var(--font-sans)' }}>
                {formatarPreco(dados.valor)}
              </span>
            </div>
          </div>
        )}

        <p
          className="text-sm text-noir/60 leading-[1.85] mb-3"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Receberás um email de confirmação
          {email ? ` em ${email}` : ''}.
        </p>

        <p
          className="text-sm text-noir/60 leading-[1.85] mb-10"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Assim que o pagamento for verificado, receberás uma confirmação por email com os detalhes do envio.
        </p>

        <Link
          href="/"
          className="inline-block bg-noir text-cream text-[11px] tracking-[0.3em] uppercase px-10 py-4 hover:bg-noir/85 transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          VOLTAR À LOJA
        </Link>
      </div>
    </div>
  )
}
