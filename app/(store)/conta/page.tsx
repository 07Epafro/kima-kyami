import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'A Minha Conta — Kima Kyami',
}

export default function ContaPage() {
  return (
    <section className="min-h-[70vh] bg-cream flex flex-col items-center justify-center px-8 text-center">
      <div className="w-8 h-px bg-gold mx-auto mb-12" />
      <p
        className="text-[9px] tracking-[0.45em] uppercase text-gold mb-4"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Em Breve
      </p>
      <h1
        className="text-noir text-[clamp(28px,4vw,48px)] font-light tracking-[0.15em] uppercase mb-6"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        A MINHA CONTA
      </h1>
      <p
        className="text-noir/50 text-sm leading-[1.9] max-w-md mb-12"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        A área de cliente estará disponível em breve. Acompanha os teus pedidos e gere as tuas preferências.
      </p>
      <Link
        href="/colecoes"
        className="inline-block border border-noir text-noir text-[10px] tracking-[0.3em] uppercase px-10 py-4 hover:bg-noir hover:text-cream transition-colors"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        DESCOBRIR COLEÇÕES
      </Link>
    </section>
  )
}
