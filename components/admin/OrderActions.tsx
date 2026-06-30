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
          <p className="text-xs text-amber-700 font-medium" style={{ fontFamily: 'var(--font-sans)' }}>
            Número de tracking obrigatório para marcar como enviada
          </p>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="ex: PT123456789PT"
            className="w-full border border-amber-300 rounded px-3 py-2 text-sm text-noir focus:outline-none focus:border-gold font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={() => avancar('ENVIADA')}
              disabled={!tracking || !!loading}
              className="flex items-center gap-2 px-4 py-2 bg-noir text-cream text-sm rounded hover:bg-noir/90 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <Truck size={14} />
              Confirmar envio
            </button>
            <button
              onClick={() => setShowTracking(false)}
              className="px-4 py-2 text-sm text-muted hover:text-noir"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {acoesAvanco.map((estado) => (
          <button
            key={estado}
            onClick={() => avancar(estado)}
            disabled={!!loading}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors disabled:opacity-50',
              'bg-noir text-cream hover:bg-noir/90'
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            <ChevronRight size={14} />
            {LABELS[estado]}
            {loading === estado && <span className="ml-1 opacity-60">…</span>}
          </button>
        ))}

        {podeCancelar && (
          <button
            onClick={() => avancar('CANCELADA')}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            <X size={14} />
            Cancelar encomenda
          </button>
        )}
      </div>

      {erro && <p className="text-xs text-red-500" style={{ fontFamily: 'var(--font-sans)' }}>{erro}</p>}

      <div className="border-t border-gray-100 pt-4">
        <label className="block text-xs tracking-widest uppercase text-muted mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
          Notas internas
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-noir focus:outline-none focus:border-gold resize-none"
          placeholder="Notas visíveis apenas no painel admin…"
        />
        <button
          onClick={guardarNotas}
          disabled={!!loading}
          className="mt-2 px-3 py-1.5 text-xs bg-gray-100 text-noir rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Guardar notas
        </button>
      </div>
    </div>
  )
}
