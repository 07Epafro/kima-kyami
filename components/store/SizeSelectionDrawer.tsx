'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ArrowRight } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { formatarPreco } from '@/lib/utils'
import type { CorProduto } from '@/types'

export interface ProdutoRelacionado {
  id: string
  nome: string
  slug: string
  preco: number
  imagens: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  produto: {
    id: string
    nome: string
    preco: number
    imagens: string[]
    slug: string
  }
  corSel: CorProduto | null
  tamanhos: number[]
  stock: Record<string, number>
  relacionados: ProdutoRelacionado[]
}

function stockKey(tamanho: number, cor: string) {
  return `${tamanho}-${cor}`
}

export default function SizeSelectionDrawer({
  isOpen, onClose, produto, corSel, tamanhos, stock, relacionados,
}: Props) {
  const { addItem, openCart } = useCart()
  const [tamSel, setTamSel] = useState<number | null>(null)

  /* Reset tamanho quando o drawer abre com nova cor */
  useEffect(() => {
    if (isOpen) setTamSel(null)
  }, [isOpen, corSel])

  /* Bloqueia scroll do body quando aberto */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const tamanhosDisponiveis = corSel
    ? tamanhos.filter(t => (stock[stockKey(t, corSel.nome)] ?? 0) > 0)
    : []

  function handleConfirmar() {
    if (!corSel || !tamSel) return
    addItem({
      produtoId: produto.id,
      slug: produto.slug,
      nome: produto.nome,
      imagem: produto.imagens[0] ?? '',
      preco: produto.preco,
      tamanho: tamSel,
      cor: corSel.nome,
    })
    onClose()
    openCart()
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-noir/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar tamanho"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[440px] bg-cream flex flex-col shadow-2xl transition-transform duration-400 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ── Header: produto confirmado ───────────────────── */}
        <div className="flex items-start gap-4 px-7 pt-7 pb-6 border-b border-noir/8">
          <div className="relative w-[72px] h-[90px] shrink-0 bg-noir/5 overflow-hidden">
            {produto.imagens[0] && (
              <Image
                src={produto.imagens[0]}
                alt={produto.nome}
                fill
                sizes="72px"
                className="object-cover"
              />
            )}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            {corSel && (
              <p className="text-[9px] tracking-spaced-xl uppercase text-muted mb-1 font-sans">
                {corSel.nome}
              </p>
            )}
            <h2 className="text-[15px] font-light text-noir leading-snug font-serif mb-3 truncate">
              {produto.nome}
            </h2>
            <p className="text-base font-light text-noir font-serif">
              {formatarPreco(produto.preco)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 -m-2 mt-1 text-noir/35 hover:text-gold transition-colors shrink-0"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Conteúdo rolável ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">

          {/* Seleção de tamanho */}
          <div className="px-7 py-7">
            <p className="text-[9px] tracking-spaced-xl uppercase text-noir/50 mb-5 font-sans">
              TAMANHO {tamSel && `— ${tamSel}`}
            </p>
            <div className="flex flex-wrap gap-2">
              {tamanhos.map(tam => {
                const disponivel = !corSel || tamanhosDisponiveis.includes(tam)
                const selecionado = tamSel === tam
                return (
                  <button
                    key={tam}
                    type="button"
                    onClick={() => disponivel && setTamSel(tam)}
                    disabled={!disponivel}
                    aria-pressed={selecionado}
                    aria-label={`Tamanho ${tam}${!disponivel ? ' — esgotado' : ''}`}
                    className={`w-[46px] h-[46px] text-[11px] border transition-all font-sans ${
                      selecionado
                        ? 'bg-noir text-cream border-noir'
                        : disponivel
                        ? 'border-noir/25 text-noir hover:border-noir hover:bg-noir/4'
                        : 'border-noir/8 text-noir/25 cursor-not-allowed line-through decoration-noir/20'
                    }`}
                  >
                    {tam}
                  </button>
                )
              })}
            </div>
            {tamanhosDisponiveis.length === 0 && corSel && (
              <p className="mt-4 text-[11px] text-amber-700 font-sans">
                Sem stock disponível para esta cor.
              </p>
            )}
          </div>

          {/* Complete o seu look */}
          {relacionados.length > 0 && (
            <div className="border-t border-noir/8 px-7 py-7">
              <p className="text-[9px] tracking-spaced-xl uppercase text-muted mb-6 font-sans">
                COMPLETE O SEU LOOK
              </p>
              <div className="space-y-5">
                {relacionados.map(rel => (
                  <div key={rel.id} className="flex items-center gap-4">
                    <Link
                      href={`/produto/${rel.slug}`}
                      onClick={onClose}
                      className="relative w-[60px] h-[75px] shrink-0 overflow-hidden bg-noir/5"
                    >
                      {rel.imagens[0] && (
                        <Image
                          src={rel.imagens[0]}
                          alt={rel.nome}
                          fill
                          sizes="60px"
                          className="object-cover hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-light text-noir leading-snug truncate font-serif">
                        {rel.nome}
                      </p>
                      <p className="text-[11px] text-muted mt-1 font-sans">
                        {formatarPreco(rel.preco)}
                      </p>
                    </div>

                    <Link
                      href={`/produto/${rel.slug}`}
                      onClick={onClose}
                      aria-label={`Ver ${rel.nome}`}
                      className="w-9 h-9 flex items-center justify-center border border-noir/15 hover:border-gold hover:text-gold transition-colors text-noir/35 shrink-0"
                    >
                      <ArrowRight size={13} strokeWidth={1.5} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── CTA Footer ───────────────────────────────────── */}
        <div className="px-7 py-5 border-t border-noir/8">
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!tamSel || tamanhosDisponiveis.length === 0}
            className={`w-full h-14 text-[11px] tracking-[0.3em] uppercase transition-all duration-200 font-sans ${
              tamSel
                ? 'bg-noir text-cream hover:bg-noir/85'
                : 'bg-noir/12 text-noir/35 cursor-not-allowed'
            }`}
          >
            {tamSel ? 'ADICIONAR AO CARRINHO E CONTINUAR' : 'SELECCIONE UM TAMANHO'}
          </button>
        </div>
      </aside>
    </>
  )
}
