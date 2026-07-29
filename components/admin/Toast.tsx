'use client'

import { useCallback, useRef, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ToastState {
  id: number
  mensagem: string
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const idRef = useRef(0)

  const mostrarErro = useCallback((mensagem: string) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, mensagem }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 6000)
  }, [])

  function remover(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const toastContainer = toasts.length > 0 ? (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className="flex items-start gap-2.5 bg-white border border-red-200 shadow-lg rounded-lg p-4"
        >
          <AlertCircle size={16} strokeWidth={1.5} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-a-charcoal font-ui flex-1">{t.mensagem}</p>
          <button
            type="button"
            onClick={() => remover(t.id)}
            aria-label="Fechar"
            className="text-a-muted hover:text-a-charcoal transition-colors shrink-0"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      ))}
    </div>
  ) : null

  return { mostrarErro, toastContainer }
}
