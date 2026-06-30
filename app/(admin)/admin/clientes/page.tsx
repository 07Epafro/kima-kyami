import db from '@/lib/db'
import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { formatarPreco } from '@/lib/utils'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'

export const metadata = { title: 'Clientes' }

type SortField = 'nome' | 'criadoEm' | 'encomendas'
type SortOrder = 'asc' | 'desc'

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; sort?: string; order?: string }>
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit
  const search = sp.search?.trim()
  const sort = (sp.sort ?? 'criadoEm') as SortField
  const order: SortOrder = sp.order === 'asc' ? 'asc' : 'desc'

  const where: Prisma.ClienteWhereInput = search
    ? { OR: [{ nome: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
    : {}

  const orderBy: Prisma.ClienteOrderByWithRelationInput =
    sort === 'nome' ? { nome: order }
    : sort === 'encomendas' ? { encomendas: { _count: order } }
    : { criadoEm: order }

  const [clientes, total] = await Promise.all([
    db.cliente.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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
  ])

  const paginas = Math.ceil(total / limit)

  function buildUrl(o: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const m = { page: String(page), search, sort, order, ...o }
    for (const [k, v] of Object.entries(m)) if (v) p.set(k, v)
    return `/admin/clientes?${p}`
  }

  function sortLink(campo: SortField, label: string) {
    const mesmo = sort === campo
    const prox = mesmo && order === 'asc' ? 'desc' : 'asc'
    return (
      <a href={buildUrl({ sort: campo, order: prox, page: '1' })} className="hover:text-noir transition-colors">
        {label}{mesmo ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
      </a>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
          {total} cliente{total !== 1 ? 's' : ''}
        </p>
        <a
          href="/api/clientes?format=csv"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 text-muted transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <Download size={13} /> Exportar CSV
        </a>
      </div>

      <form method="GET" className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Nome ou email…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:border-gold"
            style={{ fontFamily: 'var(--font-sans)' }}
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-noir text-cream text-sm rounded hover:bg-noir/90 transition-colors" style={{ fontFamily: 'var(--font-sans)' }}>
          Pesquisar
        </button>
        {search && (
          <a href="/admin/clientes" className="px-3 py-2 text-sm text-muted hover:text-noir" style={{ fontFamily: 'var(--font-sans)' }}>
            Limpar
          </a>
        )}
      </form>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {clientes.length === 0 ? (
          <p className="text-center py-12 text-sm text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            Nenhum cliente encontrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] tracking-widest uppercase text-muted border-b border-gray-100" style={{ fontFamily: 'var(--font-sans)' }}>
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
                const totalGasto = c.encomendas.reduce((s, e) => s + e.total, 0)
                const ultimaCompra = c.encomendas[0]?.criadaEm
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/admin/clientes/${c.id}`} className="text-xs font-medium text-noir hover:text-gold transition-colors">
                        {c.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{c.email}</td>
                    <td className="px-4 py-3 text-xs text-muted hidden md:table-cell">{c.telefone ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-center text-muted">{c._count.encomendas}</td>
                    <td className="px-4 py-3 text-xs text-right font-medium text-noir hidden lg:table-cell">
                      {totalGasto > 0 ? formatarPreco(totalGasto) : '—'}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted text-right hidden lg:table-cell">
                      {ultimaCompra
                        ? ultimaCompra.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {paginas > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            Página {page} de {paginas}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'var(--font-sans)' }}>
                <ChevronLeft size={13} /> Anterior
              </Link>
            )}
            {page < paginas && (
              <Link href={buildUrl({ page: String(page + 1) })}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'var(--font-sans)' }}>
                Seguinte <ChevronRight size={13} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
