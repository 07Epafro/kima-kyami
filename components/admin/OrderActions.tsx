'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EstadoEncomenda } from '@prisma/client'
import { ChevronRight, X, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

const TRANSICOES: Record<EstadoEncomenda, EstadoEncomenda[]> = {
  PENDENTE: ['PAGAMENTO_ANALISE', 'CANCELADA'],
  PAGAMENTO_ANALISE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EM_PREPARACAO', 'CANCELADA'],
  EM_PREPARACAO: ['ENVIADA', 'CANCELADA'],
  ENVIADA: ['ENTREGUE'],
  ENTREGUE: ['DEVOLVIDA'],
  CANCELADA: [],
  DEVOLVIDA: [],
}

const LABELS: Record<EstadoEncomenda, string> = {
  PENDENTE: 'Pendente',
  PAGAMENTO_ANALISE: 'Pagamento em análise',
  CONFIRMADA: 'Confirmar',
  EM_PREPARACAO: 'Em preparação',
  ENVIADA: 'Marcar como enviada',
  ENTREGUE: 'Marcar como entregue',
  CANCELADA: 'Cancelar',
  DEVOLVIDA: 'Marcar como devolvida',
}

interface Props {
  encomendaId: string
  estadoActual: EstadoEncomenda
  notasActuais?: string | null
}

export default function OrderActions({ encomendaId, estadoActual, notasActuais }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<EstadoEncomenda | null>(null)
  const [notas, setNotas] = useState(notasActuais ?? '')
  const [tracking, setTracking] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [showTracking, setShowTracking] = useState(false)

  const proximos = TRANSICOES[estadoActual]

  async function avancar(novoEstado: EstadoEncomenda) {
    if (novoEstado === 'ENVIADA' && !tracking) {
      setShowTracking(true)
      return
    }

    setErro(null)
    setLoading(novoEstado)

    const res = await fetch(`/api/encomendas/${encomendaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: novoEstado,
        notas: notas || undefined,
        ...(novoEstado === 'ENVIADA' ? { numeroTracking: tracking } : {}),
      }),
    })

    setLoading(null)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setErro(data.error ?? 'Erro ao actualizar estado')
      return
    }

    router.refresh()
  }

  async function guardarNotas() {
    setErro(null)
    setLoading('PENDENTE')
    const res = await fetch(`/api/encomendas/${encomendaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notas }),
    })
    setLoading(null)
    if (res.ok) router.refresh()
  }

  if (proximos.length === 0) return null

  const acoesAvanco = proximos.filter((e) => e !== 'CANCELADA')
  const podeCancelar = proximos.includes('CANCELADA')

  return (
    <div className="space-y-4">
      {showTracking && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
          <p className="text-xs text-amber-700 font-medium font-ui">
            Número de tracking obrigatório para marcar como enviada
          </p>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="ex: PT123456789PT"
            className="w-full border border-amber-300 rounded px-3 py-2 text-sm text-a-charcoal focus:outline-none focus:border-a-gold font-mono"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => avancar('ENVIADA')}
              disabled={!tracking || !!loading}
              className="flex items-center gap-2 px-4 py-2.5 min-h-11 bg-a-charcoal text-white text-sm rounded hover:bg-a-charcoal/90 disabled:opacity-50 font-ui"
            >
              <Truck size={14} />
              Confirmar envio
            </button>
            <button
              type="button"
              onClick={() => setShowTracking(false)}
              className="px-4 py-2.5 min-h-11 text-sm text-a-muted hover:text-a-charcoal font-ui"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {acoesAvanco.map((estado) => (
          <button
            type="button"
            key={estado}
            onClick={() => avancar(estado)}
            disabled={!!loading}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 min-h-11 rounded text-sm transition-colors disabled:opacity-50',
              'bg-a-charcoal text-white hover:bg-a-charcoal/90 font-ui'
            )}
          >
            <ChevronRight size={14} />
            {LABELS[estado]}
            {loading === estado && <span className="ml-1 opacity-60">…</span>}
          </button>
        ))}

        {podeCancelar && (
          <button
            type="button"
            onClick={() => avancar('CANCELADA')}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2.5 min-h-11 rounded text-sm text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors font-ui"
          >
            <X size={14} />
            Cancelar encomenda
          </button>
        )}
      </div>

      {erro && <p className="text-xs text-red-500 font-ui">{erro}</p>}

      <div className="border-t border-a-border pt-4">
        <label className="block text-xs tracking-widest uppercase text-a-muted mb-2 font-ui">
          Notas internas
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          className="w-full border border-a-border rounded px-3 py-2 text-sm text-a-charcoal focus:outline-none focus:border-a-gold resize-none font-ui"
          placeholder="Notas visíveis apenas no painel admin…"
        />
        <button
          onClick={guardarNotas}
          disabled={!!loading}
          type="button"
          className="mt-2 px-3 py-1.5 min-h-9 text-xs bg-a-bone text-a-charcoal border border-a-border rounded hover:bg-a-border/40 disabled:opacity-50 transition-colors font-ui"
        >
          Guardar notas
        </button>
      </div>
    </div>
  )
}
