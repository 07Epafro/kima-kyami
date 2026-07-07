'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check } from 'lucide-react'
import ProofUpload from '@/components/store/ProofUpload'
import { formatarPreco } from '@/lib/utils'

interface CheckoutData {
  encomendaId: string
  pagamentoId: string
  referencia: string
  iban: string
  titular: string
  valor: number
}

function CopiarBotao({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label="Copiar"
      className="p-1.5 text-muted hover:text-gold transition-colors"
    >
      {copiado
        ? <Check size={14} className="text-emerald-600" />
        : <Copy size={14} strokeWidth={1.5} />}
    </button>
  )
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-noir/8 last:border-0">
      <div>
        <p className="text-[9.5px] tracking-[0.2em] uppercase text-muted mb-1 font-sans">
          {label}
        </p>
        <p className="text-sm font-medium text-noir font-mono">
          {valor}
        </p>
      </div>
      <CopiarBotao texto={valor} />
    </div>
  )
}

export default function PagamentoPage() {
  const router = useRouter()
  const [dados, setDados] = useState<CheckoutData | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('kk-checkout')
      if (!raw) { router.replace('/checkout'); return }
      setDados(JSON.parse(raw) as CheckoutData)
    } catch {
      router.replace('/checkout')
    }
  }, [router])

  if (!dados) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-noir/20 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 lg:py-16">
      {/* Steps */}
      <div className="flex items-center gap-3 mb-10 text-[9px] tracking-[0.2em] uppercase font-sans">
        <span className="text-muted">Dados</span>
        <div className="h-px flex-1 bg-noir/15" />
        <span className="text-gold font-medium">Pagamento</span>
        <div className="h-px flex-1 bg-noir/15" />
        <span className="text-muted">Confirmação</span>
      </div>

      <h1 className="text-2xl font-light text-noir tracking-[0.12em] uppercase mb-2 font-serif">
        Transferência Bancária
      </h1>
      <p className="text-sm text-muted mb-8 font-sans">
        Efectua a transferência com os dados abaixo e submete o comprovante.
      </p>

      {/* Dados de transferência */}
      <div className="bg-white border border-noir/10 px-6 mb-6">
        <Campo label="Titular da conta" valor={dados.titular} />
        <Campo label="IBAN" valor={dados.iban} />
        <Campo label="Valor exacto" valor={formatarPreco(dados.valor)} />
        <Campo label="Referência (obrigatória no descritivo)" valor={dados.referencia} />
      </div>

      {/* Avisos */}
      <div className="space-y-3 mb-8">
        <div className="bg-amber-50 border border-amber-200 px-5 py-4">
          <p className="text-[12px] text-amber-800 leading-relaxed font-sans">
            <strong>Tens 48 horas</strong> para efectuar a transferência. Após esse prazo a encomenda poderá ser cancelada.
          </p>
        </div>
        <div className="bg-noir/4 px-5 py-4">
          <p className="text-[12px] text-noir/70 leading-relaxed font-sans">
            Indica <strong>sempre a referência {dados.referencia}</strong> no descritivo da transferência. Sem referência não é possível associar o pagamento à tua encomenda.
          </p>
        </div>
      </div>

      {/* Upload */}
      <div className="mb-8">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-muted mb-4 font-sans">
          Comprovante de Pagamento
        </h2>
        <p className="text-xs text-noir/60 mb-5 font-sans">
          Após efectuares a transferência, submete o comprovante. A validação é automática e imediata.
        </p>
        <ProofUpload
          pagamentoId={dados.pagamentoId}
          onConcluido={() => {
            setTimeout(() => router.push('/checkout/confirmacao'), 1500)
          }}
        />
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={() => router.push('/checkout/confirmacao')}
        className="w-full py-3 text-[10px] tracking-[0.2em] uppercase text-muted hover:text-noir transition-colors border border-noir/10 hover:border-noir/30 font-sans"
      >
        SUBMETER COMPROVANTE MAIS TARDE
      </button>
    </div>
  )
}
