'use client'

import { useState } from 'react'
import { EstadoPagamento } from '@prisma/client'

interface Props {
  pagamentoId: string
  estadoActual: EstadoPagamento
}

export default function DecisaoPagamento({ pagamentoId, estadoActual }: Props) {
  const [loading, setLoading] = useState(false)
  const [nota, setNota] = useState('')
  const [mostrarRejeitar, setMostrarRejeitar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [estadoFinal, setEstadoFinal] = useState<EstadoPagamento>(estadoActual)

  const jaDecidido =
    estadoFinal === EstadoPagamento.CONFIRMADO_ADMIN ||
    estadoFinal === EstadoPagamento.REJEITADO_ADMIN

  async function confirmar() {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`/api/pagamentos/${pagamentoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validacaoAdmin: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErro((data as { error?: string }).error ?? 'Erro ao confirmar')
        return
      }
      setEstadoFinal(EstadoPagamento.CONFIRMADO_ADMIN)
    } catch {
      setErro('Erro de ligação')
    } finally {
      setLoading(false)
    }
  }

  async function rejeitar() {
    if (!nota.trim()) {
      setErro('Nota obrigatória ao rejeitar')
      return
    }
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`/api/pagamentos/${pagamentoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validacaoAdmin: false, notaAdmin: nota }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErro((data as { error?: string }).error ?? 'Erro ao rejeitar')
        return
      }
      setEstadoFinal(EstadoPagamento.REJEITADO_ADMIN)
    } catch {
      setErro('Erro de ligação')
    } finally {
      setLoading(false)
    }
  }

  if (jaDecidido) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <p
          className="text-xs tracking-widest uppercase text-muted mb-4"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Decisão do Gestor
        </p>
        {estadoFinal === EstadoPagamento.CONFIRMADO_ADMIN ? (
          <div className="flex items-center gap-2 text-emerald-700 text-sm">
            <span className="text-base">✓</span>
            <span style={{ fontFamily: 'var(--font-sans)' }}>Pagamento confirmado</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <span className="text-base">✕</span>
            <span style={{ fontFamily: 'var(--font-sans)' }}>Pagamento rejeitado</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-4">
      <p
        className="text-xs tracking-widest uppercase text-muted"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Decisão do Gestor
      </p>

      {erro && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded" style={{ fontFamily: 'var(--font-sans)' }}>
          {erro}
        </p>
      )}

      {!mostrarRejeitar ? (
        <div className="flex gap-3">
          <button
            onClick={confirmar}
            disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {loading ? 'A processar…' : 'Confirmar pagamento'}
          </button>
          <button
            onClick={() => setMostrarRejeitar(true)}
            disabled={loading}
            className="flex-1 py-2.5 bg-white border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 transition-colors disabled:opacity-50"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Rejeitar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label
              className="block text-xs text-muted mb-1"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Motivo de rejeição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Descreve o motivo de rejeição do pagamento…"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-red-400 resize-none"
              style={{ fontFamily: 'var(--font-sans)' }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={rejeitar}
              disabled={loading || !nota.trim()}
              className="flex-1 py-2.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {loading ? 'A processar…' : 'Confirmar rejeição'}
            </button>
            <button
              onClick={() => { setMostrarRejeitar(false); setErro(null) }}
              disabled={loading}
              className="px-4 py-2.5 text-sm text-muted hover:text-noir transition-colors disabled:opacity-50"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
