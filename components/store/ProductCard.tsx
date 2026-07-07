'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import type { CorProduto } from '@/types'
import { formatarPreco } from '@/lib/utils'

interface ProdutoCard {
  id: string
  nome: string
  slug: string
  preco: number
  precoAntes?: number | null
  imagens: string[]
  emBreve: boolean
  tamanhos: number[]
  stock: Record<string, number>
}

interface Props {
  produto: ProdutoCard
  prioridade?: boolean
}

function temStock(stock: Record<string, number>) {
  return Object.values(stock).some(v => v > 0)
}

export default function ProductCard({ produto, prioridade = false }: Props) {
  const [hovered, setHovered] = useState(false)

  const esgotado = !produto.emBreve && !temStock(produto.stock)
  const novaColecao = !produto.emBreve && !esgotado

  const badge = produto.emBreve
    ? { label: 'EM BREVE', cls: 'bg-noir/80 text-cream' }
    : esgotado
    ? { label: 'ESGOTADO', cls: 'bg-noir/60 text-cream' }
    : novaColecao && produto.precoAntes
    ? { label: 'NOVO', cls: 'bg-gold text-noir' }
    : null

  return (
    <Link
      href={`/produto/${produto.slug}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-noir/5 mb-4">
        {/* Primary image */}
        {produto.imagens[0] && (
          <Image
            src={produto.imagens[0]}
            alt={produto.nome}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={prioridade}
            className={`object-cover transition-opacity duration-500 ${
              hovered && produto.imagens[1] ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}

        {/* Secondary image (crossfade on hover) */}
        {produto.imagens[1] && (
          <Image
            src={produto.imagens[1]}
            alt={`${produto.nome} — vista alternativa`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-opacity duration-500 ${
              hovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`text-[8px] tracking-[0.25em] uppercase px-2.5 py-1 font-sans ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>
        )}

        {/* Quick add button — slides up on hover */}
        {!produto.emBreve && !esgotado && (
          <div
            className={`absolute bottom-0 left-0 right-0 bg-noir/85 backdrop-blur-sm py-3 flex items-center justify-center gap-2 transition-all duration-300 ${
              hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <ShoppingBag size={12} strokeWidth={1.5} className="text-cream/70" />
            <span
              className="text-[9px] tracking-spaced-lg uppercase text-cream font-sans"
            >
              ADICIONAR
            </span>
          </div>
        )}

        {/* Esgotado overlay */}
        {esgotado && (
          <div className="absolute inset-0 bg-cream/40" />
        )}
      </div>

      {/* Info */}
      <div>
        <p
          className="text-sm font-light text-noir leading-snug tracking-wide mb-1 group-hover:text-gold transition-colors duration-200 font-serif"
        >
          {produto.nome}
        </p>

        <div className="flex items-baseline gap-2">
          {produto.precoAntes && (
            <span
              className="text-[11px] text-muted line-through font-sans"
            >
              {formatarPreco(produto.precoAntes)}
            </span>
          )}
          <span
            className={`text-[12px] font-sans ${produto.precoAntes ? 'text-gold font-medium' : 'text-noir/80'}`}
          >
            {produto.emBreve ? 'Em breve' : formatarPreco(produto.preco)}
          </span>
        </div>
      </div>
    </Link>
  )
}

// Silence unused import warning — CorProduto imported for potential future use by consumers
export type { CorProduto }
