import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <p
        className="text-[10px] tracking-[0.4em] uppercase text-muted mb-6"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        404
      </p>
      <h1
        className="text-3xl font-light text-noir tracking-[0.12em] uppercase mb-4"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Página não encontrada
      </h1>
      <p
        className="text-sm text-muted max-w-sm mb-10"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        A página que procuras não existe ou foi movida.
      </p>
      <Link
        href="/colecoes"
        className="text-[10px] tracking-[0.25em] uppercase border border-noir text-noir px-8 py-3 hover:bg-noir hover:text-cream transition-colors"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Ver coleção
      </Link>
    </div>
  )
}
