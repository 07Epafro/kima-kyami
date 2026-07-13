import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import db from '@/lib/db'
import ProductCarousel from '@/components/store/ProductCarousel'

export const revalidate = 3600

export const metadata: Metadata = {
  title: {
    absolute: 'Kima Kyami — Sapatos de Luxo Femininos em Angola',
  },
  description: 'Sapatos de luxo criados para mulheres angolanas que deixam presença por onde passam. Saltos, sandálias e mules de inspiração africana contemporânea, feitos em Luanda.',
  openGraph: {
    title: 'Kima Kyami — Sapatos de Luxo em Angola',
    description: 'Calçado feminino de luxo com inspiração africana. Descobre a nova coleção.',
    type: 'website',
  },
}

const CATEGORIAS = [
  {
    value: 'SALTOS',
    label: 'SALTOS',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
  },
  {
    value: 'SANDALIAS',
    label: 'SANDÁLIAS',
    image: 'https://images.unsplash.com/photo-1601001435957-f3399c18851e?w=800&q=80',
  },
  {
    value: 'MULES',
    label: 'MULES',
    image: 'https://images.unsplash.com/photo-1603808033176-9d134e6f4b94?w=800&q=80',
  },
  {
    value: 'COLECAO_LIMITADA',
    label: 'COLEÇÃO LIMITADA',
    image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&q=80',
  },
]

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kima Kyami',
  url: 'https://kimakyami.com',
  description: 'Sapatos de luxo de inspiração africana contemporânea.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'atendimento@kimakyami.ao',
    contactType: 'customer service',
    availableLanguage: 'Portuguese',
  },
  sameAs: [
    'https://instagram.com/kimakyami',
    'https://tiktok.com/@kimakyami',
    'https://pinterest.com/kimakyami',
  ],
}

export default async function HomePage() {
  let produtosEmBreve: { id: string; nome: string; slug: string; imagens: string[]; preco: number }[] = []
  try {
    produtosEmBreve = await db.produto.findMany({
      where: { emBreve: true, ativo: true },
      select: { id: true, nome: true, slug: true, imagens: true, preco: true },
      orderBy: { criadoEm: 'desc' },
      take: 8,
    })
  } catch { /* DB unavailable at build time — section hidden until next revalidation */ }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      {/* ─── 1. Hero ─────────────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        {/* Art direction: portrait crop em mobile, landscape em desktop */}
        <Image
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=85"
          alt="Kima Kyami — Sapatos de luxo"
          fill
          sizes="100vw"
          priority
          className="object-cover object-[center_20%] sm:object-center"
        />
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-noir/75 via-noir/40 to-noir/20" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end lg:justify-center container-kk pb-20 lg:pb-0">
          <div className="max-w-xl">
            <h1
              className="text-cream text-hero font-light leading-[1.05] tracking-[0.08em] uppercase mb-6 animate-kk-fade-up font-serif"
            >
              ELEGÂNCIA<br />EM CADA<br />PASSO.
            </h1>
            <p
              className="text-cream/85 text-sm sm:text-base leading-relaxed tracking-wide mb-10 animate-kk-fade-up font-sans"
              style={{ animationDelay: '0.15s' }}
            >
              Sapatos criados para mulheres que deixam<br className="hidden sm:block" /> presença por onde passam.
            </p>
            <Link
              href="/colecoes"
              className="inline-flex items-center justify-center bg-cream text-noir text-[10px] tracking-spaced-lg px-10 min-h-12 hover:bg-white transition-colors duration-300 animate-kk-fade-up font-sans"
              style={{ animationDelay: '0.3s' }}
            >
              DESCOBRIR COLEÇÃO
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-kk-fade-up" style={{ animationDelay: '0.6s' }}>
          <div className="w-px h-8 bg-cream/30 animate-pulse" />
        </div>
      </section>

      {/* ─── 2. Sobre a Marca ─────────────────────────────────────────── */}
      <section className="relative section-py bg-cream overflow-hidden">
        {/* Watermark */}
        <span
          className="absolute -right-8 bottom-0 text-[22vw] font-light text-noir/4 leading-none select-none pointer-events-none font-serif"
          aria-hidden="true"
        >
          KK
        </span>

        <div className="container-kk grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          {/* Logo mark — editorial frame */}
          <div className="flex flex-col items-center gap-8">
            <div className="border border-noir/12 p-10 lg:p-14 flex flex-col items-center gap-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Kima Kyami"
                width={160}
                height={110}
                className="object-contain w-36 lg:w-48 h-auto"
              />
              <div className="w-10 h-px bg-noir/20" />
              <p className="text-[8px] tracking-[0.35em] uppercase text-noir/40 font-sans">
                EST. 2024 · LUANDA
              </p>
            </div>
          </div>

          {/* Text */}
          <div>
            <p
              className="text-[10px] tracking-spaced-xl uppercase text-muted mb-6 font-sans"
            >
              A Marca
            </p>
            <h2
              className="text-title-lg font-light text-noir leading-snug tracking-widest uppercase mb-8 font-serif"
            >
              KIMA KYAMI
            </h2>
            <p
              className="text-sm text-noir/80 leading-[1.9] tracking-wide mb-10 max-w-md font-sans"
            >
              KIMA KYAMI nasceu para mulheres que não seguem caminhos.
              Elas criam o seu. Cada par é uma declaração de presença — fruto
              de uma visão africana contemporânea onde o detalhe é sagrado e
              a feminilidade, soberana.
            </p>
            <Link
              href="/marca"
              className="group inline-flex items-center gap-3 text-[10px] tracking-spaced-lg uppercase text-noir hover:text-gold transition-colors font-sans"
            >
              CONHECER A MARCA
              <span className="transition-transform group-hover:translate-y-0.5">▼</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 3. Grid de Categorias ────────────────────────────────────── */}
      <section className="bg-noir">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {CATEGORIAS.map(cat => (
            <Link
              key={cat.value}
              href={`/colecoes?categoria=${cat.value}`}
              className="group relative aspect-[3/4] overflow-hidden block"
            >
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-noir/85 via-noir/20 to-transparent transition-opacity duration-300" />
              <div className="absolute inset-0 bg-noir/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                <p
                  className="text-cream text-[11px] tracking-spaced-lg uppercase mb-1.5 group-hover:text-gold transition-colors duration-300 font-sans"
                >
                  {cat.label}
                </p>
                <p
                  className="text-cream/0 group-hover:text-gold/90 text-[9px] tracking-[0.25em] uppercase transition-all duration-300 translate-y-2 group-hover:translate-y-0 font-sans"
                >
                  VER MAIS →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 4. Quote Section ─────────────────────────────────────────── */}
      <section className="bg-noir py-20 lg:py-0 overflow-hidden">
        <div className="container-kk grid grid-cols-1 lg:grid-cols-2 min-h-[600px] p-0 lg:p-0">
          {/* Image */}
          <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[600px] order-2 lg:order-1">
            <Image
              src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=85"
              alt="Kima Kyami — Postura. Atitude."
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </div>

          {/* Quote */}
          <div className="flex flex-col items-center justify-center py-16 lg:py-24 px-10 lg:px-16 text-center order-1 lg:order-2">
            <div className="w-8 h-px bg-gold mb-12" />
            <blockquote
              className="text-cream text-title-md font-light leading-[1.3] tracking-[0.06em] uppercase mb-14 font-serif"
            >
              "NÃO É SÓ UM SAPATO.
              <br />É POSTURA.
              <br />É ATITUDE.
              <br />É KIMA KYAMI."
            </blockquote>
            <span
              className="text-gold text-[28px] tracking-spaced-max font-light font-serif"
            >
              KK
            </span>
          </div>
        </div>
      </section>

      {/* ─── 5. Novos Lançamentos ─────────────────────────────────────── */}
      {produtosEmBreve.length > 0 && (
        <section className="section-py bg-cream overflow-hidden">
          <div className="container-kk">
            {/* Header */}
            <div className="text-center mb-12">
              <p className="text-[9px] tracking-spaced-xl uppercase text-gold mb-3 font-sans">
                EM BREVE
              </p>
              <h2 className="text-title-lg font-light text-noir tracking-[0.12em] uppercase font-serif">
                NOVOS LANÇAMENTOS
              </h2>
            </div>

            {/* Carousel */}
            <ProductCarousel produtos={produtosEmBreve} />

            {/* CTA */}
            <div className="mt-12 flex justify-center">
              <Link
                href="/colecoes"
                className="text-[10px] tracking-[0.25em] uppercase text-noir border border-noir px-10 py-3.5 hover:bg-noir hover:text-cream transition-colors font-sans"
              >
                VER TODOS
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── 6. Exclusividade ─────────────────────────────────────────── */}
      <section className="bg-cream overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Image left */}
          <div className="relative aspect-[4/5] lg:aspect-auto">
            <Image
              src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=700&q=80"
              alt="Embalagem Kima Kyami"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
          </div>

          {/* Center text */}
          <div className="flex flex-col items-center justify-center py-20 px-10 lg:px-14 text-center bg-cream border-y lg:border-y-0 lg:border-x border-noir/8">
            <div className="w-6 h-px bg-gold mb-10" />
            <h2
              className="text-title-md font-light text-noir leading-[1.35] tracking-[0.1em] uppercase mb-10 font-serif"
            >
              CADA DETALHE FOI PENSADO PARA TE FAZER SENTIR EXCLUSIVA.
            </h2>
            <Link
              href="/marca"
              className="text-[10px] tracking-spaced-lg uppercase text-noir hover:text-gold transition-colors border-b border-noir/30 hover:border-gold pb-0.5 font-sans"
            >
              SABER MAIS
            </Link>
          </div>

          {/* Image right */}
          <div className="relative aspect-[4/5] lg:aspect-auto">
            <Image
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&q=80"
              alt="Saco Kima Kyami"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </>
  )
}
