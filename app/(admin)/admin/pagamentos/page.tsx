import Link from 'next/link'
import db from '@/lib/db'
import { EstadoPagamento, Prisma } from '@prisma/client'
import { formatarPreco } from '@/lib/utils'
import type { ResultadoValidacao } from '@/lib/validar-comprovante'

export const metadata = { title: 'Pagamentos' }

const ESTADO_CONFIG: Record<EstadoPagamento, { label: string; cls: string }> = {
  AGUARDA_COMPROVANTE:      { label: 'Aguarda comprovante', cls: 'bg-gray-100 text-a-muted border border-a-border'     },
  COMPROVANTE_SUBMETIDO:    { label: 'Submetido',           cls: 'bg-amber-50 text-amber-700 border border-amber-200'  },
  VALIDADO_AUTO_OK:         { label: 'Validado OK',         cls: 'bg-green-50 text-green-700 border border-green-200'  },
  VALIDADO_AUTO_ALERTA:     { label: 'Alerta auto',         cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200'},
  VALIDADO_AUTO_REJEITADO:  { label: 'Rejeitado auto',      cls: 'bg-red-50 text-red-700 border border-red-200'        },
  CONFIRMADO_ADMIN:         { label: 'Confirmado',          cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200'},
  REJEITADO_ADMIN:          { label: 'Rejeitado',           cls: 'bg-red-100 text-red-800 border border-red-300'       },
}

function tempoAtras(data: Date): string {
  const diff = Date.now() - data.getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `há ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

interface PageProps { searchParams: Promise<{ tab?: string; page?: string }> }

const PENDENTES_ESTADOS = [
  EstadoPagamento.COMPROVANTE_SUBMETIDO,
  EstadoPagamento.VALIDADO_AUTO_ALERTA,
  EstadoPagamento.VALIDADO_AUTO_REJEITADO,
]

export default async function PagamentosPage({ searchParams }: PageProps) {
  const sp   = await searchParams
  const tab  = sp.tab === 'todos' ? 'todos' : 'pendentes'
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

  const pendentes = await db.pagamento.findMany({
    where: { estado: { in: PENDENTES_ESTADOS } },
    include: { encomenda: { select: { referencia: true, cliente: { select: { nome: true } } } } },
    orderBy: { criadoEm: 'asc' },
  })

  const pendentesOrdenados = [...pendentes].sort((a, b) => {
    const pri = (e: EstadoPagamento) =>
      e === EstadoPagamento.VALIDADO_AUTO_ALERTA ? 0 :
      e === EstadoPagamento.VALIDADO_AUTO_REJEITADO ? 1 : 2
    return pri(a.estado) - pri(b.estado) || a.criadoEm.getTime() - b.criadoEm.getTime()
  })

  const [todos, totalTodos] = tab === 'todos'
    ? await Promise.all([
        db.pagamento.findMany({
          where: {},
          include: { encomenda: { select: { referencia: true, cliente: { select: { nome: true } } } } },
          orderBy: { criadoEm: 'desc' }, skip, take: limit,
        }),
        db.pagamento.count(),
      ])
    : [[], 0]

  const paginas = Math.ceil(totalTodos / limit)
  const lista   = tab === 'todos' ? todos : pendentesOrdenados

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-a-muted font-ui">
          {tab === 'pendentes' ? `${pendentes.length} pendente${pendentes.length !== 1 ? 's' : ''}` : `${totalTodos} total`}
        </p>
        {tab === 'pendentes' && pendentes.length > 0 && (
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium font-ui">
            {pendentes.length} a validar
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-a-border">
        <Link href="/admin/pagamentos?tab=pendentes"
          className={`px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase transition-colors font-ui ${
            tab === 'pendentes'
              ? 'border-b-2 border-a-charcoal text-a-charcoal font-medium -mb-px'
              : 'text-a-muted hover:text-a-charcoal'
          }`}>
          Pendentes ({pendentes.length})
        </Link>
        <Link href="/admin/pagamentos?tab=todos"
          className={`px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase transition-colors font-ui ${
            tab === 'todos'
              ? 'border-b-2 border-a-charcoal text-a-charcoal font-medium -mb-px'
              : 'text-a-muted hover:text-a-charcoal'
          }`}>
          Todos
        </Link>
      </div>

      {/* List panel */}
      <div className="bg-white border border-a-border rounded-lg overflow-hidden">
        {lista.length === 0 ? (
          <p className="text-center py-12 text-sm text-a-muted font-ui">
            {tab === 'pendentes' ? 'Nenhum pagamento pendente.' : 'Nenhum pagamento encontrado.'}
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-a-border">
              {lista.map((pag) => {
                const resultado = pag.validacaoScript as unknown as ResultadoValidacao | null
                const score     = resultado?.score ?? null
                return (
                  <div key={pag.id} className="p-4 hover:bg-a-bone transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <Link href={`/admin/pagamentos/${pag.id}`}
                        className="font-mono text-xs text-a-charcoal hover:text-a-gold transition-colors">
                        {pag.encomenda.referencia}
                      </Link>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-medium font-ui whitespace-nowrap ${ESTADO_CONFIG[pag.estado].cls}`}>
                        {ESTADO_CONFIG[pag.estado].label}
                      </span>
                    </div>
                    <p className="text-[11px] text-a-muted font-ui mb-2">{pag.encomenda.cliente.nome}</p>
                    <div className="flex items-center justify-between">
                      {score !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-a-border rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`}
                              style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-[10px] text-a-muted font-ui">{score}</span>
                        </div>
                      ) : <span />}
                      <span className="text-[10px] text-a-muted font-ui">{tempoAtras(pag.criadoEm)}</span>
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
                    <th className="px-6 py-3 text-left font-normal">Referência</th>
                    <th className="px-4 py-3 text-left font-normal">Cliente</th>
                    <th className="px-4 py-3 text-left font-normal">Estado</th>
                    <th className="px-4 py-3 text-left font-normal">Score</th>
                    <th className="px-4 py-3 text-right font-normal">Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((pag) => {
                    const resultado = pag.validacaoScript as unknown as ResultadoValidacao | null
                    const score     = resultado?.score ?? null
                    return (
                      <tr key={pag.id} className="border-b border-a-border/50 hover:bg-a-bone transition-colors last:border-0">
                        <td className="px-6 py-3">
                          <Link href={`/admin/pagamentos/${pag.id}`}
                            className="font-mono text-xs text-a-charcoal hover:text-a-gold transition-colors">
                            {pag.encomenda.referencia}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-a-muted font-ui">{pag.encomenda.cliente.nome}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-medium font-ui ${ESTADO_CONFIG[pag.estado].cls}`}>
                            {ESTADO_CONFIG[pag.estado].label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {score !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-a-border rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                  style={{ width: `${score}%` }} />
                              </div>
                              <span className="text-[10px] text-a-muted font-ui">{score}</span>
                            </div>
                          ) : <span className="text-[10px] text-a-muted">—</span>}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-a-muted text-right font-ui">
                          {tempoAtras(pag.criadoEm)}
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
      {tab === 'todos' && paginas > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-a-muted font-ui">Página {page} de {paginas}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/pagamentos?tab=todos&page=${page - 1}`}
                className="px-3 py-1.5 text-[11px] border border-a-border rounded hover:border-a-charcoal hover:text-a-charcoal transition-colors font-ui text-a-muted">
                Anterior
              </Link>
            )}
            {page < paginas && (
              <Link href={`/admin/pagamentos?tab=todos&page=${page + 1}`}
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
