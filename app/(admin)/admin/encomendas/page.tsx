import { Suspense } from 'react'
import Link from 'next/link'
import db from '@/lib/db'
import { EstadoEncomenda, Prisma } from '@prisma/client'
import { formatarPreco } from '@/lib/utils'
import { Download, Search } from 'lucide-react'

export const metadata = { title: 'Encomendas' }

const ESTADO_CONFIG: Record<EstadoEncomenda, { label: string; cls: string }> = {
  PENDENTE: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700' },
  PAGAMENTO_ANALISE: { label: 'Em análise', cls: 'bg-blue-100 text-blue-700' },
  CONFIRMADA: { label: 'Confirmada', cls: 'bg-indigo-100 text-indigo-700' },
  EM_PREPARACAO: { label: 'Em preparação', cls: 'bg-purple-100 text-purple-700' },
  ENVIADA: { label: 'Enviada', cls: 'bg-cyan-100 text-cyan-700' },
  ENTREGUE: { label: 'Entregue', cls: 'bg-green-100 text-green-700' },
  CANCELADA: { label: 'Cancelada', cls: 'bg-red-100 text-red-700' },
  DEVOLVIDA: { label: 'Devolvida', cls: 'bg-orange-100 text-orange-700' },
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    estado?: string
    search?: string
    de?: string
    ate?: string
  }>
}

export default async function EncomendasPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

  const where: Prisma.EncomendaWhereInput = {}

  const estado = sp.estado
  if (estado && Object.values(EstadoEncomenda).includes(estado as EstadoEncomenda)) {
    where.estado = estado as EstadoEncomenda
  }

  const search = sp.search?.trim()
  if (search) {
    where.OR = [
      { referencia: { contains: search, mode: 'insensitive' } },
      { cliente: { nome: { contains: search, mode: 'insensitive' } } },
      { cliente: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (sp.de || sp.ate) {
    where.criadaEm = {}
    if (sp.de) where.criadaEm.gte = new Date(sp.de)
    if (sp.ate) {
      const ateDate = new Date(sp.ate)
      ateDate.setHours(23, 59, 59, 999)
      where.criadaEm.lte = ateDate
    }
  }

  const [encomendas, total] = await Promise.all([
    db.encomenda.findMany({
      where,
      skip,
      take: limit,
      orderBy: { criadaEm: 'desc' },
      include: {
        cliente: { select: { nome: true } },
        _count: { select: { itens: true } },
      },
    }),
    db.encomenda.count({ where }),
  ])

  const paginas = Math.ceil(total / limit)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { page: String(page), estado, search, de: sp.de, ate: sp.ate, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v)
    }
    return `/admin/encomendas?${p.toString()}`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted font-sans">
          {total} encomenda{total !== 1 ? 's' : ''}
        </p>
        <a
          href="/api/encomendas?format=csv"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 text-muted transition-colors font-sans"
        >
          <Download size={13} />
          Exportar CSV
        </a>
      </div>

      <form method="GET" className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-50">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Referência ou cliente…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gold font-sans"
          />
        </div>
        <select
          name="estado"
          defaultValue={estado ?? ''}
          aria-label="Estado da encomenda"
          className="border border-gray-200 rounded px-3 py-2 text-sm text-noir focus:outline-none focus:border-gold font-sans"
        >
          <option value="">Todos os estados</option>
          {Object.entries(ESTADO_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input
          name="de"
          type="date"
          defaultValue={sp.de}
          title="Data de início"
          aria-label="Data de início"
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
        />
        <input
          name="ate"
          type="date"
          defaultValue={sp.ate}
          title="Data de fim"
          aria-label="Data de fim"
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-noir text-cream text-sm rounded hover:bg-noir/90 transition-colors font-sans"
        >
          Filtrar
        </button>
        <a
          href="/admin/encomendas"
          className="px-3 py-2 text-sm text-muted hover:text-noir transition-colors font-sans"
        >
          Limpar
        </a>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {encomendas.length === 0 ? (
          <p className="text-center py-12 text-sm text-muted font-sans">
            Nenhuma encomenda encontrada.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-widest uppercase text-muted border-b border-gray-100">
                  <th className="px-6 py-3 text-left font-normal">Referência</th>
                  <th className="px-4 py-3 text-left font-normal">Cliente</th>
                  <th className="px-4 py-3 text-center font-normal hidden sm:table-cell">Itens</th>
                  <th className="px-4 py-3 text-right font-normal">Total</th>
                  <th className="px-4 py-3 text-left font-normal">Estado</th>
                  <th className="px-4 py-3 text-right font-normal">Data</th>
                </tr>
              </thead>
              <tbody>
                {encomendas.map((enc) => (
                  <tr key={enc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/encomendas/${enc.id}`}
                        className="font-mono text-xs text-noir hover:text-gold transition-colors"
                      >
                        {enc.referencia}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{enc.cliente.nome}</td>
                    <td className="px-4 py-3 text-xs text-center text-muted hidden sm:table-cell">{enc._count.itens}</td>
                    <td className="px-4 py-3 text-xs text-right font-medium text-noir">
                      {formatarPreco(enc.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-medium ${ESTADO_CONFIG[enc.estado].cls}`}
                      >
                        {ESTADO_CONFIG[enc.estado].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted text-right">
                      {enc.criadaEm.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paginas > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted font-sans">
            Página {page} de {paginas}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors font-sans"
              >
                Anterior
              </Link>
            )}
            {page < paginas && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors font-sans"
              >
                Seguinte
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
