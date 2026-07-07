'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { formatarPreco } from '@/lib/utils'

const PORTES_GRATIS_A_PARTIR_DE = 50000
const CUSTO_PORTES = 3500

export default function CartSidebar() {
  const { items, total, count, isOpen, closeCart, removeItem, updateQty } = useCart()
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      closeBtnRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) closeCart()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, closeCart])

  const portes = total >= PORTES_GRATIS_A_PARTIR_DE ? 0 : CUSTO_PORTES

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-noir/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-104 bg-cream flex flex-col shadow-2xl transition-transform duration-400 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Carrinho de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-noir/8">
          <div className="flex items-center gap-3">
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-noir">
              Carrinho
            </h2>
            {count > 0 && (
              <span className="text-[9px] bg-gold text-noir px-2 py-0.5 rounded-full font-semibold">
                {count}
              </span>
            )}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeCart}
            aria-label="Fechar carrinho"
            className="min-w-11 min-h-11 flex items-center justify-center text-noir/60 hover:text-gold transition-colors -mr-2.5"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5 text-center">
            <div className="w-16 h-16 rounded-full border border-noir/12 flex items-center justify-center">
              <ShoppingBag size={24} strokeWidth={1} className="text-noir/30" />
            </div>
            <div>
              <p className="text-sm text-noir/60 mb-1">O teu carrinho está vazio.</p>
              <p className="text-xs text-muted">Descobre a nossa coleção exclusiva.</p>
            </div>
            <Link
              href="/colecoes"
              onClick={closeCart}
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase border border-noir text-noir px-6 py-3 hover:bg-noir hover:text-cream transition-colors"
            >
              DESCOBRIR COLEÇÃO <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <>
            {/* Items list */}
            <ul className="flex-1 overflow-y-auto px-7 py-4 space-y-5 scrollbar-hide">
              {items.map(item => (
                <li
                  key={`${item.produtoId}-${item.tamanho}-${item.cor}`}
                  className="flex gap-4 pb-5 border-b border-noir/6 last:border-0"
                >
                  <Link
                    href={`/produto/${item.slug}`}
                    onClick={closeCart}
                    className="relative w-20 h-24 shrink-0 overflow-hidden bg-noir/5"
                  >
                    <Image
                      src={item.imagem}
                      alt={item.nome}
                      fill
                      sizes="80px"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-light text-noir leading-snug truncate font-serif">
                        {item.nome}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.produtoId, item.tamanho, item.cor)}
                        aria-label="Remover artigo"
                        className="min-w-11 min-h-11 flex items-center justify-center text-noir/50 hover:text-gold transition-colors shrink-0 -mt-2 -mr-2"
                      >
                        <X size={13} strokeWidth={1.5} />
                      </button>
                    </div>

                    <p className="text-[10px] text-muted mt-1">
                      {item.cor} · Nº {item.tamanho}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      {/* Qty controls — cantos vivos, luxo */}
                      <div className="flex items-center border border-noir/15">
                        <button
                          onClick={() => updateQty(item.produtoId, item.tamanho, item.cor, item.quantidade - 1)}
                          aria-label="Diminuir quantidade"
                          className="w-8 h-8 flex items-center justify-center text-noir/65 hover:text-gold transition-colors"
                        >
                          <Minus size={10} strokeWidth={2} />
                        </button>
                        <span className="w-7 text-center text-xs text-noir select-none">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => updateQty(item.produtoId, item.tamanho, item.cor, item.quantidade + 1)}
                          aria-label="Aumentar quantidade"
                          className="w-8 h-8 flex items-center justify-center text-noir/65 hover:text-gold transition-colors"
                        >
                          <Plus size={10} strokeWidth={2} />
                        </button>
                      </div>

                      <p className="text-xs font-medium text-noir">
                        {formatarPreco(item.preco * item.quantidade)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="px-7 py-5 border-t border-noir/8 space-y-4 bg-cream">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-muted">Subtotal</span>
                  <span className="text-sm text-noir">{formatarPreco(total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-muted">Portes</span>
                  <span className="text-[11px] text-noir/60">
                    {portes === 0 ? 'Grátis' : formatarPreco(CUSTO_PORTES)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-noir/8">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-noir font-medium">Total</span>
                  <span className="text-base font-medium text-noir font-serif">
                    {formatarPreco(total + portes)}
                  </span>
                </div>
              </div>

              {portes > 0 && (
                <p className="text-[10px] text-muted text-center">
                  Faltam {formatarPreco(PORTES_GRATIS_A_PARTIR_DE - total)} para portes grátis
                </p>
              )}

              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full text-center min-h-14 py-3.5 bg-noir text-cream text-[11px] tracking-[0.25em] uppercase hover:bg-noir/85 transition-colors"
              >
                FINALIZAR ENCOMENDA
              </Link>

              <button
                type="button"
                onClick={closeCart}
                className="block w-full text-center py-3 min-h-11 text-[10px] tracking-[0.2em] uppercase text-noir/65 hover:text-noir transition-colors"
              >
                CONTINUAR A COMPRAR
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
