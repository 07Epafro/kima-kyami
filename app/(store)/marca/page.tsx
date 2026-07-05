import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'A Marca — Kima Kyami',
  description: 'Kima Kyami nasceu para mulheres que não seguem caminhos — elas criam o seu. Moda africana contemporânea de luxo.',
}

const VALORES = [
  {
    numero: '01',
    titulo: 'Identidade',
    texto: 'Cada par carrega a alma de uma mulher que sabe quem é. Não seguimos tendências — definimo-las.',
  },
  {
    numero: '02',
    titulo: 'Artesanato',
    texto: 'Materiais premium, acabamentos minuciosos. Cada detalhe é deliberado, cada costura intencional.',
  },
  {
    numero: '03',
    titulo: 'Herança',
    texto: 'Raízes africanas contemporâneas. Uma visão estética que celebra a feminilidade soberana.',
  },
]

export default function MarcaPage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=85"
          alt="Kima Kyami — A Marca"
          fill
          sizes="100vw"
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-noir/60 via-noir/30 to-noir/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 px-8 text-center">
          <p
            className="text-[9px] tracking-[0.45em] uppercase text-gold mb-4"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            A Nossa História
          </p>
          <h1
            className="text-cream text-[clamp(36px,6vw,64px)] font-light leading-tight tracking-[0.1em] uppercase"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            KIMA KYAMI
          </h1>
        </div>
      </section>

      {/* ─── Manifesto ─── */}
      <section className="bg-cream py-24 lg:py-36">
        <div className="max-w-[900px] mx-auto px-8 lg:px-16 text-center">
          <div className="w-8 h-px bg-gold mx-auto mb-12" />
          <blockquote
            className="text-noir text-[clamp(22px,3.5vw,38px)] font-light leading-[1.4] tracking-[0.06em] uppercase mb-12"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            "NASCEMOS PARA MULHERES QUE NÃO SEGUEM CAMINHOS. ELAS CRIAM O SEU."
          </blockquote>
          <p
            className="text-noir/60 text-sm leading-[1.9] tracking-wide max-w-[600px] mx-auto"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Kima Kyami é mais do que uma marca de calçado. É uma declaração de presença.
            Fundada com a missão de celebrar a feminilidade africana contemporânea,
            cada par é concebido para a mulher que conhece o seu valor e não precisa
            de pedir permissão para brilhar.
          </p>
        </div>
      </section>

      {/* ─── Valores ─── */}
      <section className="bg-noir py-24 lg:py-32">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-16">
          <p
            className="text-[9px] tracking-[0.4em] uppercase text-gold mb-16 text-center"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Os Nossos Pilares
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {VALORES.map(v => (
              <div key={v.numero} className="text-center md:text-left">
                <span
                  className="text-[48px] font-light text-cream/8 leading-none block mb-4"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {v.numero}
                </span>
                <h3
                  className="text-cream text-[18px] tracking-[0.2em] uppercase mb-4 font-light"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {v.titulo}
                </h3>
                <div className="w-8 h-px bg-gold mb-4 mx-auto md:mx-0" />
                <p
                  className="text-cream/45 text-[12px] leading-[1.9] tracking-wide"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {v.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Imagem editorial ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
        <div className="relative aspect-[4/3] lg:aspect-auto">
          <Image
            src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&q=85"
            alt="Kima Kyami — Artesanato"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="bg-cream flex flex-col justify-center px-10 lg:px-16 py-20">
          <p
            className="text-[9px] tracking-[0.4em] uppercase text-gold mb-6"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            A Nossa Visão
          </p>
          <h2
            className="text-noir text-[clamp(26px,3.5vw,40px)] font-light leading-snug tracking-[0.1em] uppercase mb-8"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            CADA DETALHE CONTA UMA HISTÓRIA
          </h2>
          <p
            className="text-noir/60 text-sm leading-[1.9] tracking-wide mb-10 max-w-md"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Do design inicial ao acabamento final, cada Kima Kyami passa por um processo
            rigoroso de criação. Materiais cuidadosamente seleccionados, formas que
            abraçam o pé, e uma atenção ao detalhe que transforma cada par numa obra de arte.
          </p>
          <Link
            href="/colecoes"
            className="inline-block text-[10px] tracking-[0.3em] uppercase border border-noir text-noir px-10 py-4 hover:bg-noir hover:text-cream transition-colors w-fit"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            VER COLEÇÕES
          </Link>
        </div>
      </section>
    </>
  )
}
