'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ProductCard from '@/components/store/ProductCard'

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
  produtosIniciais: ProdutoCard[]
  total: number
  categoria?: string
  ordem: string
  limite: number
}

export default function ColecoesClient({ produtosIniciais, total, categoria, ordem, limite }: Props) {
  const [produtos, setProdutos] = useState<ProdutoCard[]>(produtosIniciais)
  const [cursor, setCursor] = useState<string | null>(
    produtosIniciais.length === limite ? produtosIniciais[produtosIniciais.length - 1].id : null
  )
  const [carregando, setCarregando] = useState(false)
  const sentinela = useRef<HTMLDivElement>(null)

  const carregarMais = useCallback(async () => {
    if (!cursor || carregando) return
    setCarregando(true)

    const params = new URLSearchParams({ public: '1', limite: String(limite), cursor, ordem })
    if (categoria) params.set('categoria', categoria)

    try {
      const res = await fetch(`/api/produtos?${params}`)
      if (!res.ok) return
      const data = (await res.json()) as { itens: ProdutoCard[]; nextCursor: string | null }
      setProdutos(prev => [...prev, ...data.itens])
      setCursor(data.nextCursor)
    } catch { /* silent */ } finally {
      setCarregando(false)
    }
  }, [cursor, carregando, categoria, ordem, limite])

  useEffect(() => {
    const el = sentinela.current
    if (!el) return

    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) carregarMais() },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [carregarMais])

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
        {produtos.map((p, i) => (
          <ProductCard key={p.id} produto={p} prioridade={i < 4} />
        ))}
      </div>

      {/* Sentinel + loading */}
      {cursor && (
        <div ref={sentinela} className="flex justify-center py-12">
          {carregando && (
            <div
              className="text-[10px] tracking-[0.3em] uppercase text-muted animate-pulse"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              A CARREGAR…
            </div>
          )}
        </div>
      )}

      {/* Count */}
      {!cursor && produtos.length > 0 && (
        <p
          className="text-center mt-10 text-[10px] text-muted tracking-[0.2em]"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {produtos.length} de {total} peças
        </p>
      )}
    </>
  )
}
