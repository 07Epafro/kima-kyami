import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getImagensSite } from '@/lib/imagens-site'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Lookbook — Kima Kyami',
  description: 'Inspira-te com os nossos editoriais. Moda contemporânea de luxo.',
}

const EDITORIAIS = [
  {
    id: 1,
    titulo: 'VERÃO 2025',
    subtitulo: 'Luz & Presença',
    chave: 'lookbook-verao-2025',
    span: 'lg:col-span-2 lg:row-span-2',
    aspect: 'aspect-[4/5] lg:aspect-auto lg:min-h-[600px]',
  },
  {
    id: 2,
    titulo: 'COLEÇÃO NOITE',
    subtitulo: 'Poder & Elegância',
    chave: 'lookbook-colecao-noite',
    span: '',
    aspect: 'aspect-[4/5]',
  },
  {
    id: 3,
    titulo: 'SALTOS SIGNATURE',
    subtitulo: 'A Declaração',
    chave: 'lookbook-saltos-signature',
    span: '',
    aspect: 'aspect-[4/5]',
  },
  {
    id: 4,
    titulo: 'MULES EXCLUSIVOS',
    subtitulo: 'Sofisticação Discreta',
    chave: 'lookbook-mules',
    span: '',
    aspect: 'aspect-[4/5]',
  },
  {
    id: 5,
    titulo: 'SANDÁLIAS',
    subtitulo: 'Liberdade com Estilo',
    chave: 'lookbook-sandalias',
    span: '',
    aspect: 'aspect-[4/5]',
  },
]

export default async function LookbookPage() {
  const img = await getImagensSite()

  return (
    <>
      {/* ─── Header ─── */}
      <section className="bg-cream pt-20 pb-12 text-center px-8">
        <p
          className="text-[9px] tracking-[0.45em] uppercase text-gold mb-4"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Editorial
        </p>
        <h1
          className="text-noir text-[clamp(36px,6vw,64px)] font-light tracking-[0.15em] uppercase"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          LOOKBOOK
        </h1>
        <div className="w-8 h-px bg-gold mx-auto mt-8" />
      </section>

      {/* ─── Grid Editorial ─── */}
      <section className="bg-cream section-pb">
        <div className="container-kk grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-3">
          {EDITORIAIS.map(editorial => (
            <Link
              key={editorial.id}
              href="/colecoes"
              className={`group relative overflow-hidden block ${editorial.span} ${editorial.aspect}`}
            >
              <Image
                src={img[editorial.chave]}
                alt={editorial.titulo}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/80 via-noir/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                <p
                  className="text-[9px] tracking-[0.3em] uppercase text-gold mb-2"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {editorial.subtitulo}
                </p>
                <p
                  className="text-cream text-[clamp(14px,2vw,20px)] font-light tracking-[0.15em] uppercase"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {editorial.titulo}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-noir section-py text-center px-8">
        <p
          className="text-cream/40 text-[9px] tracking-[0.4em] uppercase mb-4"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Inspira-te
        </p>
        <h2
          className="text-cream text-[clamp(24px,4vw,40px)] font-light tracking-[0.12em] uppercase mb-10"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          DESCOBRE A COLEÇÃO
        </h2>
        <Link
          href="/colecoes"
          className="inline-block border border-cream text-cream text-[10px] tracking-[0.3em] px-10 py-4 hover:bg-cream hover:text-noir transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          VER TODOS OS MODELOS
        </Link>
      </section>
    </>
  )
}
