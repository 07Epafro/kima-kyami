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
  SALTOS: 'Saltos',
  SANDALIAS: 'Sandálias',
  MULES: 'Mules',
  COLECAO_LIMITADA: 'Coleção Limitada',
}

const categoriaBadge: Record<CategoriaKey, string> = {
  SALTOS: 'bg-purple-100 text-purple-700',
  SANDALIAS: 'bg-blue-100 text-blue-700',
  MULES: 'bg-amber-100 text-amber-700',
  COLECAO_LIMITADA: 'bg-rose-100 text-rose-700',
}

type SearchParams = {
  page?: string
  categoria?: string
  estado?: string
  search?: string
  sort?: string
  order?: string
}

type SortField = 'nome' | 'preco' | 'stock' | 'criadoEm'
type SortOrder = 'asc' | 'desc'

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const limit = 20
  const skip = (page - 1) * limit

  const sortParam = (params.sort ?? 'criadoEm') as SortField
  const order: SortOrder = params.order === 'asc' ? 'asc' : 'desc'
  const validSorts: SortField[] = ['nome', 'preco', 'stock', 'criadoEm']
  const sortField: SortField = validSorts.includes(sortParam) ? sortParam : 'criadoEm'

  const orderBy: Prisma.ProdutoOrderByWithRelationInput =
    sortField === 'stock' ? { criadoEm: order } : { [sortField]: order }

  const where: Prisma.ProdutoWhereInput = {}

  if (params.categoria && CATEGORIAS.includes(params.categoria as CategoriaKey)) {
    where.categoria = params.categoria as Categoria
  }

  if (params.estado === 'ativo') {
    where.ativo = true
    where.emBreve = false
  } else if (params.estado === 'emBreve') {
    where.emBreve = true
  } else if (params.estado === 'inativo') {
    where.ativo = false
  }

  if (params.search) {
    where.nome = { contains: params.search, mode: 'insensitive' }
  }

  const [produtos, total] = await Promise.all([
    db.produto.findMany({ where, skip, take: limit, orderBy }),
    db.produto.count({ where }),
  ])

  const paginas = Math.ceil(total / limit)

  function buildUrl(overrides: Partial<SearchParams>) {
    const merged: SearchParams = {
      page: params.page,
      categoria: params.categoria,
      estado: params.estado,
      search: params.search,
      sort: params.sort,
      order: params.order,
      ...overrides,
    }
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== '') sp.set(k, v)
    }
    return `/admin/produtos?${sp.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package size={20} className="text-gold" />
          <h1
            className="text-2xl font-light text-noir font-serif"
          >
            Produtos
          </h1>
          <span className="text-xs text-muted">({total})</span>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 bg-noir text-cream text-xs tracking-widest uppercase px-4 py-2.5 rounded-lg hover:bg-noir/90 transition-colors font-sans"
        >
          <Plus size={14} />
          Novo Produto
        </Link>
      </div>

      {/* Filtros */}
      <form method="GET" action="/admin/produtos" className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label
              htmlFor="search"
              className="block text-[10px] tracking-widest uppercase text-muted mb-1.5 font-sans"
            >
              Pesquisar
            </label>
            <input
              id="search"
              name="search"
              type="text"
              defaultValue={params.search ?? ''}
              placeholder="Nome do produto..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-noir placeholder-gray-300 focus:outline-none focus:border-gold/60 transition-colors"
            />
          </div>

          <div className="min-w-[150px]">
            <label
              htmlFor="categoria"
              className="block text-[10px] tracking-widest uppercase text-muted mb-1.5 font-sans"
            >
              Categoria
            </label>
            <select
              id="categoria"
              name="categoria"
              defaultValue={params.categoria ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-noir focus:outline-none focus:border-gold/60 transition-colors bg-white"
            >
              <option value="">Todas</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {categoriaLabels[c]}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[140px]">
            <label
              htmlFor="estado"
              className="block text-[10px] tracking-widest uppercase text-muted mb-1.5 font-sans"
            >
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={params.estado ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-noir focus:outline-none focus:border-gold/60 transition-colors bg-white"
            >
              <option value="">Todos</option>
              <option value="ativo">Activo</option>
              <option value="emBreve">Em breve</option>
              <option value="inativo">Inactivo</option>
            </select>
          </div>

          <div className="min-w-[150px]">
            <label
              htmlFor="sort"
              className="block text-[10px] tracking-widest uppercase text-muted mb-1.5 font-sans"
            >
              Ordenar por
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={params.sort ?? 'criadoEm'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-noir focus:outline-none focus:border-gold/60 transition-colors bg-white"
            >
              <option value="criadoEm">Data criação</option>
              <option value="nome">Nome</option>
              <option value="preco">Preço</option>
              <option value="stock">Stock</option>
            </select>
          </div>

          <div className="min-w-[110px]">
            <label
              htmlFor="order"
              className="block text-[10px] tracking-widest uppercase text-muted mb-1.5 font-sans"
            >
              Direcção
            </label>
            <select
              id="order"
              name="order"
              defaultValue={params.order ?? 'desc'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-noir focus:outline-none focus:border-gold/60 transition-colors bg-white"
            >
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-noir text-cream text-xs tracking-widest uppercase px-5 py-2 rounded-lg hover:bg-noir/90 transition-colors font-sans"
          >
            Filtrar
          </button>

          <Link
            href="/admin/produtos"
            className="text-xs text-muted hover:text-noir transition-colors py-2 px-2 font-sans"
          >
            Limpar
          </Link>
        </div>
      </form>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {produtos.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-muted">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-widest uppercase text-muted border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-normal">Produto</th>
                  <th className="px-4 py-3 text-left font-normal">Categoria</th>
                  <th className="px-4 py-3 text-right font-normal">Preço</th>
                  <th className="px-4 py-3 text-right font-normal">Stock</th>
                  <th className="px-4 py-3 text-center font-normal">Estado</th>
                  <th className="px-4 py-3 text-center font-normal">Activo</th>
                  <th className="px-4 py-3 text-right font-normal">Criado</th>
                  <th className="px-4 py-3 text-right font-normal">Acções</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => {
                  const stockTyped = p.stock as unknown as Record<string, number>
                  const stockTotal = Object.values(stockTyped).reduce(
                    (acc, v) => acc + (typeof v === 'number' ? v : 0),
                    0,
                  )
                  const primImagem = p.imagens[0]

                  let estadoLabel: string
                  let estadoCor: string
                  if (!p.ativo) {
                    estadoLabel = 'Inactivo'
                    estadoCor = 'bg-red-100 text-red-600'
                  } else if (p.emBreve) {
                    estadoLabel = 'Em breve'
                    estadoCor = 'bg-amber-100 text-amber-600'
                  } else {
                    estadoLabel = 'Activo'
                    estadoCor = 'bg-emerald-100 text-emerald-600'
                  }

                  const dataCriacao = p.criadoEm.toLocaleDateString('pt-PT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                  })

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {primImagem ? (
                              <Image
                                src={primImagem}
                                alt={p.nome}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={16} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-noir">{p.nome}</p>
                            <p className="text-[10px] text-muted font-mono">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                            categoriaBadge[p.categoria as CategoriaKey] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {categoriaLabels[p.categoria as CategoriaKey] ?? p.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-medium text-noir">{formatarPreco(p.preco)}</span>
                        {p.precoAntes && (
                          <span className="block text-[10px] text-muted line-through">
                            {formatarPreco(p.precoAntes)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-xs font-medium ${stockTotal === 0 ? 'text-red-500' : 'text-noir'}`}
                        >
                          {stockTotal}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${estadoCor}`}
                        >
                          {estadoLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ToggleAtivoButton id={p.id} ativo={p.ativo} />
                      </td>
                      <td className="px-4 py-3 text-right text-[10px] text-muted">
                        {dataCriacao}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2 pr-1">
                          <Link
                            href={`/admin/produtos/${p.id}`}
                            className="p-2 rounded text-noir/45 hover:text-gold hover:bg-gold/10 transition-colors"
                            title="Editar produto"
                          >
                            <Edit2 size={15} />
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
        )}
      </div>

      {/* Paginação */}
      {paginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted font-sans">
            Página {page} de {paginas}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="flex items-center gap-1.5 text-xs text-noir border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={14} />
                Anterior
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-gray-300 border border-gray-100 rounded-lg px-3 py-2 cursor-not-allowed">
                <ChevronLeft size={14} />
                Anterior
              </span>
            )}

            {page < paginas ? (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="flex items-center gap-1.5 text-xs text-noir border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                Próxima
                <ChevronRight size={14} />
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-gray-300 border border-gray-100 rounded-lg px-3 py-2 cursor-not-allowed">
                Próxima
                <ChevronRight size={14} />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
