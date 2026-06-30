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
    <div className="min-h-screen bg-[#faf7f4] flex flex-col items-center justify-center px-6 text-center">
      <p
        className="text-[10px] tracking-[0.4em] uppercase text-muted mb-4"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Erro no painel
      </p>
      <h1
        className="text-2xl font-light text-noir tracking-[0.12em] uppercase mb-4"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Algo correu mal
      </h1>
      <p
        className="text-sm text-muted max-w-sm mb-8"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {error.message || 'Ocorreu um erro inesperado no painel de administração.'}
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="text-[10px] tracking-[0.25em] uppercase border border-noir text-noir px-6 py-2.5 hover:bg-noir hover:text-cream transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Tentar novamente
        </button>
        <Link
          href="/admin/dashboard"
          className="text-[10px] tracking-[0.25em] uppercase border border-noir/30 text-muted px-6 py-2.5 hover:border-noir hover:text-noir transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
