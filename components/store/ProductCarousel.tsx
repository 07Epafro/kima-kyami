'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProdutoEmBreve {
  id: string
  nome: string
  slug: string
  imagens: string[]
  preco: number
}

interface Props {
  produtos: ProdutoEmBreve[]
}

function formatarPreco(valor: number) {
  return `€ ${valor.toFixed(2).replace('.', ',')}`
}

export default function ProductCarousel({ produtos }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({
      left: dir === 'left' ? -320 : 320,
      behavior: 'smooth',
    })
  }

  if (produtos.length === 0) return null

  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      <button
        onClick={() => scroll('left')}
        aria-label="Anterior"
        className="absolute left-2 top-[calc(50%-60px)] -translate-y-1/2 z-10 w-10 h-10 bg-cream/90 border border-noir/10 rounded-full flex items-center justify-center text-noir/60 hover:text-gold hover:border-gold transition-all opacity-0 group-hover/carousel:opacity-100 backdrop-blur-sm shadow-sm"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
      </button>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4"
      >
        {produtos.map(produto => (
          <div
            key={produto.id}
            className="snap-start shrink-0 w-[240px] sm:w-[270px]"
          >
            <Link href={`/produto/${produto.slug}`} className="group/card block">
              <div className="relative aspect-[3/4] overflow-hidden bg-noir/5 mb-4">
                {produto.imagens[0] && (
                  <Image
                    src={produto.imagens[0]}
                    alt={produto.nome}
                    fill
                    sizes="(max-width: 640px) 240px, 270px"
                    className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                  />
                )}
                {/* Em breve badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className="text-[8px] tracking-[0.25em] uppercase bg-noir/80 text-cream px-2.5 py-1 backdrop-blur-sm"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    EM BREVE
                  </span>
                </div>
              </div>

              <p
                className="text-sm font-light text-noir tracking-wide leading-snug"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {produto.nome}
              </p>
              <p
                className="text-[11px] text-muted italic mt-0.5"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {formatarPreco(produto.preco)}
              </p>
            </Link>
          </div>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll('right')}
        aria-label="Seguinte"
        className="absolute right-2 top-[calc(50%-60px)] -translate-y-1/2 z-10 w-10 h-10 bg-cream/90 border border-noir/10 rounded-full flex items-center justify-center text-noir/60 hover:text-gold hover:border-gold transition-all opacity-0 group-hover/carousel:opacity-100 backdrop-blur-sm shadow-sm"
      >
        <ChevronRight size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}
