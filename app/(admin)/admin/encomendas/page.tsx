import Link from 'next/link'
import db from '@/lib/db'
import { EstadoEncomenda, Prisma } from '@prisma/client'
import { formatarPreco } from '@/lib/utils'
import { ArrowRight, Download, Search, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'

export const metadata = { title: 'Encomendas' }

const ESTADO_CONFIG: Record<EstadoEncomenda, { label: string; cls: string }> = {
  PENDENTE:          { label: 'Pendente',        cls: 'bg-amber-50  text-amber-700  border border-amber-200' },
  PAGAMENTO_ANALISE: { label: 'Em análise',      cls: 'bg-blue-50   text-blue-700   border border-blue-200'  },
  CONFIRMADA:        { label: 'Confirmada',       cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200'},
  EM_PREPARACAO:     { label: 'Em preparação',   cls: 'bg-purple-50 text-purple-700 border border-purple-200'},
  ENVIADA:           { label: 'Enviada',          cls: 'bg-cyan-50   text-cyan-700   border border-cyan-200'  },
  ENTREGUE:          { label: 'Entregue',         cls: 'bg-green-50  text-green-700  border border-green-200' },
  CANCELADA:         { label: 'Cancelada',        cls: 'bg-red-50    text-red-700    border border-red-200'   },
  DEVOLVIDA:         { label: 'Devolvida',        cls: 'bg-orange-50 text-orange-700 border border-orange-200'},
}

/** "Maria Silva" → "MS" · "Madonna" → "MA" · usado no avatar-iniciais da tabela. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase()
}

interface PageProps {
  searchParams: Promise<{
    page?: string; estado?: string; search?: string; de?: string; ate?: string
  }>
}

export default async function EncomendasPage({ searchParams }: PageProps) {
  const sp    = await searchParams
  const page  = Math.max(1, parseInt(sp.page ?? '1'))
  const limit = 20
  const skip  = (page - 1) * limit

  const where: Prisma.EncomendaWhereInput = {}
  const estado = sp.estado
  if (estado && Object.values(EstadoEncomenda).includes(estado as EstadoEncomenda)) {
    where.estado = estado as EstadoEncomenda
  }
  const search = sp.search?.trim()
  if (search) {
    where.OR = [
      { referencia: { contains: search, mode: 'insensitive' } },
      { cliente:    { nome:  { contains: search, mode: 'insensitive' } } },
      { cliente:    { email: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (sp.de || sp.ate) {
    where.criadaEm = {}
    if (sp.de) where.criadaEm.gte = new Date(sp.de)
    if (sp.ate) {
      const d = new Date(sp.ate); d.setHours(23, 59, 59, 999)
      where.criadaEm.lte = d
    }
  }

  const [encomendas, total] = await Promise.all([
    db.encomenda.findMany({
      where, skip, take: limit, orderBy: { criadaEm: 'desc' },
      include: { cliente: { select: { nome: true } }, _count: { select: { itens: true } } },
    }),
    db.encomenda.count({ where }),
  ])
  const paginas = Math.ceil(total / limit)
  const inicio  = total === 0 ? 0 : skip + 1
  const fim     = Math.min(skip + limit, total)

  function buildUrl(o: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ page: String(page), estado, search, de: sp.de, ate: sp.ate, ...o })) {
      if (v) p.set(k, v)
    }
    return `/admin/encomendas?${p}`
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        icon={ShoppingBag}
        title="Encomendas"
        description={`${total} encomenda${total !== 1 ? 's' : ''} no total.`}
        action={
          <a
            href="/api/encomendas?format=csv"
            className="flex items-center gap-1.5 px-4 min-h-11 text-[10px] tracking-wide uppercase border border-a-border rounded-lg text-a-muted hover:text-a-charcoal hover:border-a-charcoal transition-colors font-ui"
          >
            <Download size={12} strokeWidth={1.5} /> Exportar CSV
          </a>
        }
      />

      {/* Filter form */}
      <div className="bg-white border border-a-border rounded-lg p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-1.5 text-a-muted">
          <SlidersHorizontal size={12} strokeWidth={1.5} />
          <span className="text-[10px] tracking-[0.14em] uppercase font-ui">Filtros</span>
        </div>
        <form method="GET" className="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap lg:items-center">
          <div className="relative col-span-2 lg:flex-1 lg:min-w-44">
            <Search size={13} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-a-muted" />
            <input
              name="search" defaultValue={search} placeholder="Referência ou cliente…"
              aria-label="Pesquisar encomendas"
              className="w-full pl-9 pr-3 min-h-11 border border-a-border rounded-lg text-sm focus:outline-none focus:border-a-gold font-ui"
            />
          </div>
          <select name="estado" defaultValue={estado ?? ''} aria-label="Estado da encomenda"
            className="col-span-2 border border-a-border rounded-lg px-3 min-h-11 text-sm text-a-charcoal focus:outline-none focus:border-a-gold font-ui bg-white lg:col-span-1">
            <option value="">Todos os estados</option>
            {Object.entries(ESTADO_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <input name="de"  type="date" defaultValue={sp.de}  title="Data de início" aria-label="Data de início"
            className="w-full border border-a-border rounded-lg px-3 min-h-11 text-sm focus:outline-none focus:border-a-gold font-ui lg:w-auto" />
          <input name="ate" type="date" defaultValue={sp.ate} title="Data de fim"    aria-label="Data de fim"
            className="w-full border border-a-border rounded-lg px-3 min-h-11 text-sm focus:outline-none focus:border-a-gold font-ui lg:w-auto" />
          <button type="submit"
            className="px-6 min-h-11 bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase rounded-lg hover:bg-a-charcoal/90 transition-colors font-ui">
            Filtrar
          </button>
          <a href="/admin/encomendas" className="px-3 min-h-11 flex items-center text-[11px] text-a-muted hover:text-a-charcoal transition-colors font-ui text-center self-center">
            Limpar
          </a>
        </form>
      </div>

      {/* List panel */}
      <div className="bg-white border border-a-border rounded-lg overflow-hidden shadow-sm">
        {encomendas.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag size={28} strokeWidth={1} className="text-a-border mx-auto mb-3" />
            <p className="text-sm text-a-muted font-ui">Nenhuma encomenda encontrada.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-a-border">
              {encomendas.map((enc) => (
                <div key={enc.id} className="p-4 hover:bg-a-bone transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Link href={`/admin/encomendas/${enc.id}`}
                      className="font-mono text-xs text-a-charcoal hover:text-a-gold transition-colors">
                      {enc.referencia}
                    </Link>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-medium font-ui whitespace-nowrap ${ESTADO_CONFIG[enc.estado].cls}`}>
                      {ESTADO_CONFIG[enc.estado].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 shrink-0 rounded-full bg-a-bone border border-a-border flex items-center justify-center text-[11px] font-medium text-a-charcoal font-ui">
                      {iniciais(enc.cliente.nome)}
                    </span>
                    <p className="text-[11px] text-a-muted font-ui">{enc.cliente.nome}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-a-muted font-ui">
                      {enc.criadaEm.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                    <span className="text-sm font-medium text-a-charcoal font-ui">{formatarPreco(enc.total)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[9.5px] tracking-[0.18em] uppercase text-a-muted border-b border-a-border font-ui">
                    <th className="px-6 py-3 text-left font-normal">Referência</th>
                    <th className="px-4 py-3 text-left font-normal">Cliente</th>
                    <th className="px-4 py-3 text-center font-normal">Itens</th>
                    <th className="px-4 py-3 text-right font-normal">Total</th>
                    <th className="px-4 py-3 text-left font-normal">Estado</th>
                    <th className="px-4 py-3 text-right font-normal">Data</th>
                    <th className="px-4 py-3 text-right font-normal hidden lg:table-cell"><span className="sr-only">Acções</span></th>
                  </tr>
                </thead>
                <tbody>
                  {encomendas.map((enc) => (
                    <tr key={enc.id} className="group border-b border-a-border/50 hover:bg-a-bone transition-colors last:border-0">
                      <td className="px-6 py-3">
                        <Link href={`/admin/encomendas/${enc.id}`}
                          className="font-mono text-xs text-a-charcoal hover:text-a-gold transition-colors">
                          {enc.referencia}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 shrink-0 rounded-full bg-a-bone border border-a-border flex items-center justify-center text-[11px] font-medium text-a-charcoal font-ui">
                            {iniciais(enc.cliente.nome)}
                          </span>
                          <span className="text-xs text-a-muted font-ui">{enc.cliente.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-center text-a-muted font-ui">{enc._count.itens}</td>
                      <td className="px-4 py-3 text-xs text-right font-medium text-a-charcoal font-ui">{formatarPreco(enc.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-medium font-ui ${ESTADO_CONFIG[enc.estado].cls}`}>
                          {ESTADO_CONFIG[enc.estado].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-a-muted text-right font-ui">
                        {enc.criadaEm.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <Link href={`/admin/encomendas/${enc.id}`}
                          className="inline-flex items-center gap-1 text-[11px] text-a-charcoal opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity font-ui hover:text-a-gold">
                          Ver detalhes <ArrowRight size={12} strokeWidth={1.5} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {encomendas.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-a-muted font-ui">
            Mostrando {inicio} a {fim} de {total} encomenda{total !== 1 ? 's' : ''}
          </span>
          {paginas > 1 && (
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-[11px] border border-a-border rounded-lg hover:border-a-charcoal hover:text-a-charcoal transition-colors font-ui text-a-muted">
                  Anterior
                </Link>
              )}
              {page < paginas && (
                <Link href={buildUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-[11px] border border-a-border rounded-lg hover:border-a-charcoal hover:text-a-charcoal transition-colors font-ui text-a-muted">
                  Seguinte
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
