'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <p
        className="text-[10px] tracking-[0.4em] uppercase text-muted mb-6"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Erro inesperado
      </p>
      <h1
        className="text-3xl font-light text-noir tracking-[0.12em] uppercase mb-4"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Algo correu mal
      </h1>
      <p
        className="text-sm text-muted max-w-sm mb-10"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Ocorreu um erro inesperado. Tenta novamente ou volta à página inicial.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="text-[10px] tracking-[0.25em] uppercase border border-noir text-noir px-8 py-3 hover:bg-noir hover:text-cream transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="text-[10px] tracking-[0.25em] uppercase border border-noir/30 text-muted px-8 py-3 hover:border-noir hover:text-noir transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Início
        </Link>
      </div>
    </div>
  )
}
