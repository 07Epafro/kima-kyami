import db from '@/lib/db'
import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { formatarPreco } from '@/lib/utils'
import { Search, Download, Users, Wallet } from 'lucide-react'

export const metadata = { title: 'Clientes' }

type SortField = 'nome' | 'criadoEm' | 'encomendas'
type SortOrder = 'asc' | 'desc'

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; sort?: string; order?: string }>
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  const primeira = partes[0].charAt(0)
  const ultima   = partes[partes.length - 1].charAt(0)
  return (primeira + ultima).toUpperCase()
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const sp    = await searchParams
  const page  = Math.max(1, parseInt(sp.page ?? '1'))
  const limit = 20
  const skip  = (page - 1) * limit
  const search = sp.search?.trim()
  const sort   = (sp.sort ?? 'criadoEm') as SortField
  const order: SortOrder = sp.order === 'asc' ? 'asc' : 'desc'

  const where: Prisma.ClienteWhereInput = search
    ? { OR: [{ nome: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
    : {}

  const orderBy: Prisma.ClienteOrderByWithRelationInput =
    sort === 'nome'      ? { nome: order }
    : sort === 'encomendas' ? { encomendas: { _count: order } }
    : { criadoEm: order }

  const [clientes, total, receitaAgregada, totalClientesGlobal] = await Promise.all([
    db.cliente.findMany({
      where, orderBy, skip, take: limit,
      include: {
        _count: { select: { encomendas: true } },
        encomendas: {
          where: { estado: { not: 'CANCELADA' } },
          select: { total: true, criadaEm: true },
          orderBy: { criadaEm: 'desc' },
          take: 1,
        },
      },
    }),
    db.cliente.count({ where }),
    // Site-wide (unfiltered) revenue, used only for the LTV average card below —
    // independent of the current search so the card stays accurate while filtering.
    db.encomenda.aggregate({
      where: { estado: { not: 'CANCELADA' } },
      _sum: { total: true },
    }),
    db.cliente.count(),
  ])
  const paginas  = Math.ceil(total / limit)
  const ltvMedio = totalClientesGlobal > 0 ? (receitaAgregada._sum.total ?? 0) / totalClientesGlobal : 0

  function buildUrl(o: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ page: String(page), search, sort, order, ...o })) if (v) p.set(k, v)
    return `/admin/clientes?${p}`
  }

  function sortLink(campo: SortField, label: string) {
    const mesmo = sort === campo
    const prox  = mesmo && order === 'asc' ? 'desc' : 'asc'
    return (
      <a href={buildUrl({ sort: campo, order: prox, page: '1' })} className="hover:text-a-charcoal transition-colors">
        {label}{mesmo ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
      </a>
    )
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        <div className="bg-white border border-a-border rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4 sm:mb-5">
            <p className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted font-ui leading-tight max-w-30">
              Total de Clientes
            </p>
            <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center shrink-0">
              <Users size={15} strokeWidth={1.5} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-light text-a-charcoal font-display leading-none tracking-tight">
            {total}
          </p>
        </div>
        <div className="bg-white border border-a-border rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4 sm:mb-5">
            <p className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted font-ui leading-tight max-w-30">
              Valor Vitalício Médio
            </p>
            <div className="w-8 h-8 rounded bg-a-gold/10 flex items-center justify-center shrink-0">
              <Wallet size={15} strokeWidth={1.5} className="text-a-gold" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-light text-a-charcoal font-display leading-none tracking-tight">
            {formatarPreco(ltvMedio)}
          </p>
          <p className="text-[10px] text-a-muted font-ui mt-1">por cliente · todo o histórico</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-a-muted font-ui">{total} cliente{total !== 1 ? 's' : ''}</p>
        <a href="/api/clientes?format=csv"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wide uppercase border border-a-border rounded text-a-muted hover:text-a-charcoal hover:border-a-charcoal transition-colors font-ui">
          <Download size={12} strokeWidth={1.5} /> Exportar CSV
        </a>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-a-muted" />
          <input name="search" defaultValue={search} placeholder="Nome ou email…" aria-label="Pesquisar clientes"
            className="w-full pl-9 pr-3 py-2 border border-a-border rounded-lg text-sm bg-white focus:outline-none focus:border-a-gold font-ui" />
        </div>
        <button type="submit"
          className="px-4 py-2 bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase rounded-lg hover:bg-a-charcoal/90 transition-colors font-ui">
          Pesquisar
        </button>
        {search && (
          <a href="/admin/clientes" className="px-3 py-2 text-[11px] text-a-muted hover:text-a-charcoal font-ui">
            Limpar
          </a>
        )}
      </form>

      {/* List panel */}
      <div className="bg-white border border-a-border rounded-lg overflow-hidden">
        {clientes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-11 h-11 rounded-lg bg-a-bone border border-a-border flex items-center justify-center mx-auto mb-3">
              <Users size={18} strokeWidth={1.5} className="text-a-muted" />
            </div>
            <p className="text-sm text-a-muted font-ui">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-a-border">
              {clientes.map((c) => {
                const totalGasto   = c.encomendas.reduce((s, e) => s + e.total, 0)
                const ultimaCompra = c.encomendas[0]?.criadaEm
                return (
                  <div key={c.id} className="p-4 flex items-start gap-3 hover:bg-a-bone transition-colors">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-a-bone border border-a-border flex items-center justify-center text-[11px] font-medium text-a-charcoal shrink-0">
                      {iniciais(c.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link href={`/admin/clientes/${c.id}`}
                          className="text-sm font-medium text-a-charcoal hover:text-a-gold transition-colors font-display truncate">
                          {c.nome}
                        </Link>
                        <span className="text-[10px] bg-a-bone text-a-muted border border-a-border px-2 py-0.5 rounded font-ui whitespace-nowrap">
                          {c._count.encomendas} enc.
                        </span>
                      </div>
                      <p className="text-[11px] text-a-muted font-ui mb-2">{c.email}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-a-muted font-ui">
                          {ultimaCompra
                            ? ultimaCompra.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })
                            : '—'}
                        </span>
                        <span className="text-sm font-medium text-a-charcoal font-ui">
                          {totalGasto > 0 ? formatarPreco(totalGasto) : '—'}
                        </span>
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
                    <th className="px-6 py-3 text-left font-normal">{sortLink('nome', 'Nome')}</th>
                    <th className="px-4 py-3 text-left font-normal">Email</th>
                    <th className="px-4 py-3 text-left font-normal hidden md:table-cell">Telefone</th>
                    <th className="px-4 py-3 text-center font-normal">{sortLink('encomendas', 'Encomendas')}</th>
                    <th className="px-4 py-3 text-right font-normal hidden lg:table-cell">Total gasto</th>
                    <th className="px-4 py-3 text-right font-normal hidden lg:table-cell">Última compra</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => {
                    const totalGasto   = c.encomendas.reduce((s, e) => s + e.total, 0)
                    const ultimaCompra = c.encomendas[0]?.criadaEm
                    return (
                      <tr key={c.id} className="border-b border-a-border/50 hover:bg-a-bone transition-colors last:border-0">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-a-bone border border-a-border flex items-center justify-center text-[11px] font-medium text-a-charcoal shrink-0">
                              {iniciais(c.nome)}
                            </div>
                            <Link href={`/admin/clientes/${c.id}`}
                              className="text-xs font-medium text-a-charcoal hover:text-a-gold transition-colors">
                              {c.nome}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-a-muted font-ui">{c.email}</td>
                        <td className="px-4 py-3 text-xs text-a-muted font-ui hidden md:table-cell">{c.telefone ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-center text-a-muted font-ui">{c._count.encomendas}</td>
                        <td className="px-4 py-3 text-xs text-right font-medium text-a-charcoal font-ui hidden lg:table-cell">
                          {totalGasto > 0 ? formatarPreco(totalGasto) : '—'}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-a-muted text-right font-ui hidden lg:table-cell">
                          {ultimaCompra
                            ? ultimaCompra.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })
                            : '—'}
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
          <span className="text-[11px] text-a-muted font-ui">Página {page} de {paginas}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] border border-a-border rounded hover:border-a-charcoal hover:text-a-charcoal transition-colors font-ui text-a-muted">
                Anterior
              </Link>
            )}
            {page < paginas && (
              <Link href={buildUrl({ page: String(page + 1) })}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] border border-a-border rounded hover:border-a-charcoal hover:text-a-charcoal transition-colors font-ui text-a-muted">
                Seguinte
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
