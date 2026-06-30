'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  imagens: string[]
  nome: string
}

export default function ProductGallery({ imagens, nome }: Props) {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(() => setIdx(i => (i === 0 ? imagens.length - 1 : i - 1)), [imagens.length])
  const next = useCallback(() => setIdx(i => (i === imagens.length - 1 ? 0 : i + 1)), [imagens.length])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev()
    touchStartX.current = null
  }

  if (imagens.length === 0) {
    return (
      <div className="aspect-[3/4] bg-noir/8 flex items-center justify-center">
        <span className="text-muted text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
          Sem imagens
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div
        className="relative aspect-[3/4] overflow-hidden bg-noir/5 group"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          key={imagens[idx]}
          src={imagens[idx]}
          alt={`${nome} — imagem ${idx + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={idx === 0}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Navigation arrows */}
        {imagens.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Imagem anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-cream/80 backdrop-blur-sm flex items-center justify-center text-noir/70 hover:text-gold hover:bg-cream transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={next}
              aria-label="Próxima imagem"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-cream/80 backdrop-blur-sm flex items-center justify-center text-noir/70 hover:text-gold hover:bg-cream transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          </>
        )}

        {/* Counter */}
        {imagens.length > 1 && (
          <div
            className="absolute bottom-3 right-3 text-[9px] text-cream/70 bg-noir/50 backdrop-blur-sm px-2 py-1 tracking-wider"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {idx + 1} / {imagens.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {imagens.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {imagens.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ver imagem ${i + 1}`}
              className={`relative shrink-0 w-16 h-20 overflow-hidden transition-all ${
                i === idx
                  ? 'ring-1 ring-gold ring-offset-1'
                  : 'ring-1 ring-transparent hover:ring-noir/20'
              }`}
            >
              <Image
                src={src}
                alt={`${nome} miniatura ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
