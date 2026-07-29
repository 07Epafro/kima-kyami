'use client'

import { useCallback, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmState {
  titulo: string
  descricao?: string
  labelConfirmar: string
  perigo: boolean
}

const ESTADO_INICIAL: ConfirmState = { titulo: '', labelConfirmar: 'Confirmar', perigo: false }

interface ConfirmOptions {
  descricao?: string
  labelConfirmar?: string
  perigo?: boolean
}

export function useConfirm() {
  const [aberto, setAberto] = useState(false)
  const [estado, setEstado] = useState<ConfirmState>(ESTADO_INICIAL)
  const resolverRef = useRef<((valor: boolean) => void) | null>(null)

  const confirmar = useCallback((titulo: string, opts: ConfirmOptions = {}) => {
    setEstado({
      titulo,
      descricao: opts.descricao,
      labelConfirmar: opts.labelConfirmar ?? 'Confirmar',
      perigo: opts.perigo ?? false,
    })
    setAberto(true)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  function responder(valor: boolean) {
    setAberto(false)
    resolverRef.current?.(valor)
    resolverRef.current = null
  }

  const dialog = aberto ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-a-charcoal/60 backdrop-blur-sm"
        onClick={() => responder(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-titulo"
        className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          {estado.perigo && (
            <div className="shrink-0 w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle size={16} strokeWidth={1.5} className="text-red-500" />
            </div>
          )}
          <div className="min-w-0">
            <p id="confirm-dialog-titulo" className="text-sm font-medium text-a-charcoal font-ui">
              {estado.titulo}
            </p>
            {estado.descricao && (
              <p className="text-xs text-a-muted mt-1.5 font-ui leading-relaxed">{estado.descricao}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => responder(false)}
            className="text-[10px] tracking-[0.18em] uppercase text-a-muted hover:text-a-charcoal transition-colors font-ui px-2 min-h-9"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => responder(true)}
            className={`text-[10px] tracking-[0.18em] uppercase px-5 min-h-9 rounded-lg transition-colors font-ui ${
              estado.perigo
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-a-charcoal text-white hover:bg-a-charcoal/90'
            }`}
          >
            {estado.labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return { confirmar, dialog }
}
