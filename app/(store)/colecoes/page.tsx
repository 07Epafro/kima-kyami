import type { Metadata } from 'next'
import Link from 'next/link'
import db from '@/lib/db'
import { Categoria } from '@prisma/client'
import ColecoesClient from '@/components/store/ColecoesClient'
import SortSelect from '@/components/store/SortSelect'

export const revalidate = 300

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'SALTOS', label: 'Saltos' },
  { value: 'SANDALIAS', label: 'Sandálias' },
  { value: 'MULES', label: 'Mules' },
  { value: 'COLECAO_LIMITADA', label: 'Coleção Limitada' },
]

const ORDENS = [
  { value: 'novidades', label: 'Novidades' },
  { value: 'preco_asc', label: 'Preço: crescente' },
  { value: 'preco_desc', label: 'Preço: decrescente' },
]

const LIMITE = 12

interface PageProps {
  searchParams: Promise<{ categoria?: string; ordem?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const cat = CATEGORIAS.find(c => c.value === sp.categoria)
  return {
    title: cat ? `${cat.label} — Coleções` : 'Coleções',
    description: `Descobre a coleção ${cat?.label ?? 'completa'} da Kima Kyami. Sapatos de luxo de inspiração africana.`,
  }
}

export default async function ColecoesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const categoriaFiltro = sp.categoria as Categoria | undefined
  const ordemFiltro = sp.ordem ?? 'novidades'

  const categoriaValida = categoriaFiltro && CATEGORIAS.some(c => c.value === categoriaFiltro)
    ? categoriaFiltro
    : undefined

  const orderBy =
    ordemFiltro === 'preco_asc' ? { preco: 'asc' as const }
    : ordemFiltro === 'preco_desc' ? { preco: 'desc' as const }
    : { criadoEm: 'desc' as const }

  const [produtos, total] = await Promise.all([
    db.produto.findMany({
      where: {
        ativo: true,
        ...(categoriaValida ? { categoria: categoriaValida } : {}),
      },
      orderBy,
      take: LIMITE,
      select: {
        id: true, nome: true, slug: true, preco: true, precoAntes: true,
        categoria: true, imagens: true, emBreve: true, tamanhos: true, stock: true,
      },
    }),
    db.produto.count({
      where: {
        ativo: true,
        ...(categoriaValida ? { categoria: categoriaValida } : {}),
      },
    }),
  ])

  const produtosTyped = produtos.map(p => ({ ...p, stock: (p.stock ?? {}) as Record<string, number> }))
  const catActual = CATEGORIAS.find(c => c.value === categoriaValida)

  function buildUrl(o: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { categoria: categoriaFiltro, ordem: ordemFiltro, ...o }
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v))
    return `/colecoes?${p}`
  }

  return (
    <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-16 py-10 lg:py-14">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-muted mb-8"
        style={{ fontFamily: 'var(--font-sans)' }}
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-gold transition-colors">INÍCIO</Link>
        <span>/</span>
        <span className={catActual ? 'hover:text-gold transition-colors' : 'text-noir'}>
          {catActual ? (
            <Link href="/colecoes">COLEÇÕES</Link>
          ) : 'COLEÇÕES'}
        </span>
        {catActual && (
          <>
            <span>/</span>
            <span className="text-noir uppercase">{catActual.label}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[clamp(28px,4vw,48px)] font-light text-noir tracking-[0.12em] uppercase"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {catActual ? catActual.label : 'Coleções'}
        </h1>
        <p
          className="text-xs text-muted mt-2"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {total} peça{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-10 pb-6 border-b border-noir/8">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/colecoes"
            className={`text-[9.5px] tracking-[0.2em] uppercase px-4 py-2 border transition-colors ${
              !categoriaValida
                ? 'bg-noir text-cream border-noir'
                : 'border-noir/20 text-noir/60 hover:border-noir hover:text-noir'
            }`}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            TODAS
          </Link>
          {CATEGORIAS.map(cat => (
            <Link
              key={cat.value}
              href={buildUrl({ categoria: cat.value, ordem: undefined })}
              className={`text-[9.5px] tracking-[0.2em] uppercase px-4 py-2 border transition-colors ${
                categoriaValida === cat.value
                  ? 'bg-noir text-cream border-noir'
                  : 'border-noir/20 text-noir/60 hover:border-noir hover:text-noir'
              }`}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {cat.label.toUpperCase()}
            </Link>
          ))}
        </div>

        {/* Ordenação */}
        <SortSelect
          ordens={ORDENS}
          defaultValue={ordemFiltro}
          categoria={categoriaValida}
        />
      </div>

      {/* Grid */}
      {produtos.length === 0 ? (
        <div className="py-24 text-center">
          <p
            className="text-muted text-sm"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Nenhum produto encontrado.
          </p>
          <Link
            href="/colecoes"
            className="inline-block mt-6 text-[10px] tracking-[0.25em] uppercase border border-noir text-noir px-8 py-3 hover:bg-noir hover:text-cream transition-colors"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            VER TODOS
          </Link>
        </div>
      ) : (
        <ColecoesClient
          produtosIniciais={produtosTyped}
          total={total}
          categoria={categoriaValida}
          ordem={ordemFiltro}
          limite={LIMITE}
        />
      )}
    </div>
  )
}
