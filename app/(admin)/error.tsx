'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-a-bone flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[9.5px] tracking-[0.35em] uppercase text-a-muted mb-4 font-ui">
        Erro no painel
      </p>
      <h1 className="text-2xl font-light text-a-charcoal tracking-[0.1em] mb-4 font-display">
        Algo correu mal
      </h1>
      <p className="text-sm text-a-muted max-w-sm mb-8 font-ui">
        {error.message || 'Ocorreu um erro inesperado no painel de administração.'}
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="text-[10px] tracking-[0.22em] uppercase border border-a-charcoal text-a-charcoal px-6 py-2.5 hover:bg-a-charcoal hover:text-white transition-colors font-ui"
        >
          Tentar novamente
        </button>
        <Link
          href="/admin/dashboard"
          className="text-[10px] tracking-[0.22em] uppercase border border-a-border text-a-muted px-6 py-2.5 hover:border-a-charcoal hover:text-a-charcoal transition-colors font-ui"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
