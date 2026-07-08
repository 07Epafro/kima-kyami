import db from '@/lib/db'
import { Categoria, Prisma } from '@prisma/client'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Plus, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import { formatarPreco } from '@/lib/utils'
import DeleteButton from '@/components/admin/DeleteButton'
import ToggleAtivoButton from '@/components/admin/ToggleAtivoButton'

export const metadata = { title: 'Produtos' }

const CATEGORIAS = ['SALTOS', 'SANDALIAS', 'MULES', 'COLECAO_LIMITADA'] as const
type CategoriaKey = (typeof CATEGORIAS)[number]

const categoriaLabels: Record<CategoriaKey, string> = {
  SALTOS: 'Saltos', SANDALIAS: 'Sandálias', MULES: 'Mules', COLECAO_LIMITADA: 'Coleção Limitada',
}
const categoriaBadge: Record<CategoriaKey, string> = {
  SALTOS:           'bg-purple-50 text-purple-700 border border-purple-200',
  SANDALIAS:        'bg-blue-50   text-blue-700   border border-blue-200',
  MULES:            'bg-amber-50  text-amber-700  border border-amber-200',
  COLECAO_LIMITADA: 'bg-rose-50   text-rose-700   border border-rose-200',
}

type SearchParams = { page?: string; categoria?: string; estado?: string; search?: string; sort?: string; order?: string }
type SortField    = 'nome' | 'preco' | 'stock' | 'criadoEm'
type SortOrder    = 'asc' | 'desc'

export default async function ProdutosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params     = await searchParams
  const page       = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const limit      = 20
  const skip       = (page - 1) * limit
  const sortParam  = (params.sort ?? 'criadoEm') as SortField
  const order: SortOrder = params.order === 'asc' ? 'asc' : 'desc'
  const validSorts: SortField[] = ['nome', 'preco', 'stock', 'criadoEm']
  const sortField  = validSorts.includes(sortParam) ? sortParam : 'criadoEm'
  const orderBy: Prisma.ProdutoOrderByWithRelationInput =
    sortField === 'stock' ? { criadoEm: order } : { [sortField]: order }

  const where: Prisma.ProdutoWhereInput = {}
  if (params.categoria && CATEGORIAS.includes(params.categoria as CategoriaKey)) {
    where.categoria = params.categoria as Categoria
  }
  if      (params.estado === 'ativo')    { where.ativo = true;  where.emBreve = false }
  else if (params.estado === 'emBreve')  { where.emBreve = true }
  else if (params.estado === 'inativo')  { where.ativo = false }
  if (params.search) where.nome = { contains: params.search, mode: 'insensitive' }

  const [produtos, total] = await Promise.all([
    db.produto.findMany({ where, skip, take: limit, orderBy }),
    db.produto.count({ where }),
  ])
  const paginas = Math.ceil(total / limit)

  function buildUrl(o: Partial<SearchParams>) {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...params, ...o })) if (v) sp.set(k, v)
    return `/admin/produtos?${sp}`
  }

  function estadoInfo(p: typeof produtos[0]) {
    if (!p.ativo)    return { label: 'Inactivo', cls: 'bg-red-50    text-red-700    border border-red-200'    }
    if (p.emBreve)   return { label: 'Em breve', cls: 'bg-amber-50  text-amber-700  border border-amber-200'  }
    return               { label: 'Activo',   cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package size={18} strokeWidth={1.5} className="text-a-gold" />
          <h1 className="text-xl font-light text-a-charcoal font-display tracking-tight">Produtos</h1>
          <span className="text-[11px] text-a-muted font-ui">({total})</span>
        </div>
        <Link href="/admin/produtos/novo"
          className="flex items-center gap-2 bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase px-4 py-2.5 rounded hover:bg-a-charcoal/90 transition-colors font-ui">
          <Plus size={13} strokeWidth={1.5} /> Novo Produto
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" action="/admin/produtos" className="bg-white border border-a-border rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-44">
            <label htmlFor="search" className="block text-[9.5px] tracking-[0.2em] uppercase text-a-muted mb-1.5 font-ui">Pesquisar</label>
            <input id="search" name="search" type="text" defaultValue={params.search ?? ''}
              placeholder="Nome do produto..."
              className="w-full border border-a-border rounded px-3 py-2 text-sm text-a-charcoal placeholder-a-muted/50 focus:outline-none focus:border-a-gold transition-colors font-ui" />
          </div>
          <div className="min-w-36">
            <label htmlFor="categoria" className="block text-[9.5px] tracking-[0.2em] uppercase text-a-muted mb-1.5 font-ui">Categoria</label>
            <select id="categoria" name="categoria" defaultValue={params.categoria ?? ''}
              className="w-full border border-a-border rounded px-3 py-2 text-sm text-a-charcoal focus:outline-none focus:border-a-gold transition-colors bg-white font-ui">
              <option value="">Todas</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{categoriaLabels[c]}</option>)}
            </select>
          </div>
          <div className="min-w-32">
            <label htmlFor="estado" className="block text-[9.5px] tracking-[0.2em] uppercase text-a-muted mb-1.5 font-ui">Estado</label>
            <select id="estado" name="estado" defaultValue={params.estado ?? ''}
              className="w-full border border-a-border rounded px-3 py-2 text-sm text-a-charcoal focus:outline-none focus:border-a-gold transition-colors bg-white font-ui">
              <option value="">Todos</option>
              <option value="ativo">Activo</option>
              <option value="emBreve">Em breve</option>
              <option value="inativo">Inactivo</option>
            </select>
          </div>
          <div className="min-w-36">
            <label htmlFor="sort" className="block text-[9.5px] tracking-[0.2em] uppercase text-a-muted mb-1.5 font-ui">Ordenar por</label>
            <select id="sort" name="sort" defaultValue={params.sort ?? 'criadoEm'}
              className="w-full border border-a-border rounded px-3 py-2 text-sm text-a-charcoal focus:outline-none focus:border-a-gold transition-colors bg-white font-ui">
              <option value="criadoEm">Data criação</option>
              <option value="nome">Nome</option>
              <option value="preco">Preço</option>
            </select>
          </div>
          <div className="min-w-28">
            <label htmlFor="order" className="block text-[9.5px] tracking-[0.2em] uppercase text-a-muted mb-1.5 font-ui">Direcção</label>
            <select id="order" name="order" defaultValue={params.order ?? 'desc'}
              className="w-full border border-a-border rounded px-3 py-2 text-sm text-a-charcoal focus:outline-none focus:border-a-gold transition-colors bg-white font-ui">
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>
          <button type="submit"
            className="bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase px-5 py-2 rounded hover:bg-a-charcoal/90 transition-colors font-ui">
            Filtrar
          </button>
          <Link href="/admin/produtos" className="text-[11px] text-a-muted hover:text-a-charcoal transition-colors py-2 px-1 font-ui">
            Limpar
          </Link>
        </div>
      </form>

      {/* List panel */}
      <div className="bg-white border border-a-border rounded-lg overflow-hidden">
        {produtos.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={28} strokeWidth={1} className="text-a-border mx-auto mb-3" />
            <p className="text-sm text-a-muted font-ui">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-a-border">
              {produtos.map((p) => {
                const primImagem = p.imagens[0]
                const { label, cls } = estadoInfo(p)
                return (
                  <div key={p.id} className="p-4 flex items-start gap-3 hover:bg-a-bone transition-colors">
                    <div className="w-14 h-14 rounded bg-a-bone border border-a-border overflow-hidden shrink-0">
                      {primImagem
                        ? <Image src={primImagem} alt={p.nome} width={56} height={56} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package size={14} strokeWidth={1} className="text-a-border" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link href={`/admin/produtos/${p.id}`}
                          className="text-sm font-medium text-a-charcoal hover:text-a-gold transition-colors font-display truncate">
                          {p.nome}
                        </Link>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-medium font-ui whitespace-nowrap ${cls}`}>{label}</span>
                      </div>
                      <p className="text-[10px] text-a-muted font-mono mb-2">{p.slug}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-medium font-ui ${categoriaBadge[p.categoria as CategoriaKey] ?? 'bg-a-bone text-a-muted border border-a-border'}`}>
                          {categoriaLabels[p.categoria as CategoriaKey] ?? p.categoria}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-a-charcoal font-ui">{formatarPreco(p.preco)}</span>
                          <Link href={`/admin/produtos/${p.id}`}
                            className="p-1.5 rounded text-a-muted hover:text-a-gold hover:bg-a-gold/10 transition-colors"
                            title="Editar">
                            <Edit2 size={13} strokeWidth={1.5} />
                          </Link>
                          <DeleteButton id={p.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[9.5px] tracking-[0.18em] uppercase text-a-muted border-b border-a-border font-ui">
                    <th className="px-4 py-3 text-left font-normal">Produto</th>
                    <th className="px-4 py-3 text-left font-normal hidden lg:table-cell">Categoria</th>
                    <th className="px-4 py-3 text-right font-normal">Preço</th>
                    <th className="px-4 py-3 text-right font-normal hidden xl:table-cell">Stock</th>
                    <th className="px-4 py-3 text-center font-normal">Estado</th>
                    <th className="px-4 py-3 text-center font-normal">Activo</th>
                    <th className="px-4 py-3 text-right font-normal hidden xl:table-cell">Criado</th>
                    <th className="px-4 py-3 text-right font-normal">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p) => {
                    const stockTyped = p.stock as unknown as Record<string, number>
                    const stockTotal = Object.values(stockTyped).reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0)
                    const primImagem = p.imagens[0]
                    const { label, cls } = estadoInfo(p)
                    const dataCriacao = p.criadoEm.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })

                    return (
                      <tr key={p.id} className="border-b border-a-border/50 hover:bg-a-bone transition-colors last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded bg-a-bone border border-a-border overflow-hidden shrink-0">
                              {primImagem
                                ? <Image src={primImagem} alt={p.nome} width={48} height={48} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Package size={13} strokeWidth={1} className="text-a-border" /></div>}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-a-charcoal">{p.nome}</p>
                              <p className="text-[10px] text-a-muted font-mono">{p.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-medium font-ui ${categoriaBadge[p.categoria as CategoriaKey] ?? 'bg-a-bone text-a-muted border border-a-border'}`}>
                            {categoriaLabels[p.categoria as CategoriaKey] ?? p.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs font-medium text-a-charcoal font-ui">{formatarPreco(p.preco)}</span>
                          {p.precoAntes && (
                            <span className="block text-[10px] text-a-muted line-through font-ui">{formatarPreco(p.precoAntes)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right hidden xl:table-cell">
                          <span className={`text-xs font-medium font-ui ${stockTotal === 0 ? 'text-red-500' : 'text-a-charcoal'}`}>
                            {stockTotal}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-medium font-ui ${cls}`}>{label}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ToggleAtivoButton id={p.id} ativo={p.ativo} />
                        </td>
                        <td className="px-4 py-3 text-right text-[10px] text-a-muted font-ui hidden xl:table-cell">
                          {dataCriacao}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5 pr-1">
                            <Link href={`/admin/produtos/${p.id}`}
                              className="p-1.5 rounded text-a-muted hover:text-a-gold hover:bg-a-gold/10 transition-colors" title="Editar">
                              <Edit2 size={14} strokeWidth={1.5} />
                            </Link>
                            <DeleteButton id={p.id} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {paginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-a-muted font-ui">Página {page} de {paginas}</p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link href={buildUrl({ page: String(page - 1) })}
                className="flex items-center gap-1.5 text-[11px] text-a-muted border border-a-border rounded px-3 py-2 hover:border-a-charcoal hover:text-a-charcoal transition-colors font-ui">
                <ChevronLeft size={13} strokeWidth={1.5} /> Anterior
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-a-border border border-a-border/40 rounded px-3 py-2 cursor-not-allowed font-ui">
                <ChevronLeft size={13} strokeWidth={1.5} /> Anterior
              </span>
            )}
            {page < paginas ? (
              <Link href={buildUrl({ page: String(page + 1) })}
                className="flex items-center gap-1.5 text-[11px] text-a-muted border border-a-border rounded px-3 py-2 hover:border-a-charcoal hover:text-a-charcoal transition-colors font-ui">
                Próxima <ChevronRight size={13} strokeWidth={1.5} />
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-a-border border border-a-border/40 rounded px-3 py-2 cursor-not-allowed font-ui">
                Próxima <ChevronRight size={13} strokeWidth={1.5} />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
