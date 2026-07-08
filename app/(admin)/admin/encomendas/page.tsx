import Link from 'next/link'
import db from '@/lib/db'
import { EstadoEncomenda, Prisma } from '@prisma/client'
import { formatarPreco } from '@/lib/utils'
import { Download, Search } from 'lucide-react'

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

  function buildUrl(o: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ page: String(page), estado, search, de: sp.de, ate: sp.ate, ...o })) {
      if (v) p.set(k, v)
    }
    return `/admin/encomendas?${p}`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-a-muted font-ui">{total} encomenda{total !== 1 ? 's' : ''}</p>
        <a
          href="/api/encomendas?format=csv"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wide uppercase border border-a-border rounded text-a-muted hover:text-a-charcoal hover:border-a-charcoal transition-colors font-ui"
        >
          <Download size={12} strokeWidth={1.5} /> Exportar CSV
        </a>
      </div>

      {/* Filter form */}
      <form method="GET" className="bg-white border border-a-border rounded-lg p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-44">
          <Search size={13} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-a-muted" />
          <input
            name="search" defaultValue={search} placeholder="Referência ou cliente…"
            aria-label="Pesquisar encomendas"
            className="w-full pl-9 pr-3 py-2 border border-a-border rounded text-sm focus:outline-none focus:border-a-gold font-ui"
          />
        </div>
        <select name="estado" defaultValue={estado ?? ''} aria-label="Estado da encomenda"
          className="border border-a-border rounded px-3 py-2 text-sm text-a-charcoal focus:outline-none focus:border-a-gold font-ui bg-white">
          <option value="">Todos os estados</option>
          {Object.entries(ESTADO_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input name="de"  type="date" defaultValue={sp.de}  title="Data de início" aria-label="Data de início"
          className="border border-a-border rounded px-3 py-2 text-sm focus:outline-none focus:border-a-gold font-ui" />
        <input name="ate" type="date" defaultValue={sp.ate} title="Data de fim"    aria-label="Data de fim"
          className="border border-a-border rounded px-3 py-2 text-sm focus:outline-none focus:border-a-gold font-ui" />
        <button type="submit"
          className="px-4 py-2 bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase rounded hover:bg-a-charcoal/90 transition-colors font-ui">
          Filtrar
        </button>
        <a href="/admin/encomendas" className="px-3 py-2 text-[11px] text-a-muted hover:text-a-charcoal transition-colors font-ui">
          Limpar
        </a>
      </form>

      {/* List panel */}
      <div className="bg-white border border-a-border rounded-lg overflow-hidden">
        {encomendas.length === 0 ? (
          <p className="text-center py-12 text-sm text-a-muted font-ui">Nenhuma encomenda encontrada.</p>
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
                  <p className="text-[11px] text-a-muted font-ui mb-1">{enc.cliente.nome}</p>
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
                  </tr>
                </thead>
                <tbody>
                  {encomendas.map((enc) => (
                    <tr key={enc.id} className="border-b border-a-border/50 hover:bg-a-bone transition-colors last:border-0">
                      <td className="px-6 py-3">
                        <Link href={`/admin/encomendas/${enc.id}`}
                          className="font-mono text-xs text-a-charcoal hover:text-a-gold transition-colors">
                          {enc.referencia}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-a-muted font-ui">{enc.cliente.nome}</td>
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
                    </tr>
                  ))}
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
                className="px-3 py-1.5 text-[11px] border border-a-border rounded hover:border-a-charcoal hover:text-a-charcoal transition-colors font-ui text-a-muted">
                Anterior
              </Link>
            )}
            {page < paginas && (
              <Link href={buildUrl({ page: String(page + 1) })}
                className="px-3 py-1.5 text-[11px] border border-a-border rounded hover:border-a-charcoal hover:text-a-charcoal transition-colors font-ui text-a-muted">
                Seguinte
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
