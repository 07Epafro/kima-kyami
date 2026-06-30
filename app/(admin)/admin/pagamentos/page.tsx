import Link from 'next/link'
import db from '@/lib/db'
import { EstadoPagamento, Prisma } from '@prisma/client'
import type { ResultadoValidacao } from '@/lib/validar-comprovante'

export const metadata = { title: 'Pagamentos' }

const ESTADO_CONFIG: Record<EstadoPagamento, { label: string; cls: string }> = {
  AGUARDA_COMPROVANTE: { label: 'Aguarda comprovante', cls: 'bg-gray-100 text-gray-600' },
  COMPROVANTE_SUBMETIDO: { label: 'Comprovante submetido', cls: 'bg-amber-100 text-amber-700' },
  VALIDADO_AUTO_OK: { label: 'Validado auto OK', cls: 'bg-green-100 text-green-700' },
  VALIDADO_AUTO_ALERTA: { label: 'Alerta auto', cls: 'bg-yellow-100 text-yellow-700' },
  VALIDADO_AUTO_REJEITADO: { label: 'Rejeitado auto', cls: 'bg-red-100 text-red-700' },
  CONFIRMADO_ADMIN: { label: 'Confirmado', cls: 'bg-emerald-100 text-emerald-700' },
  REJEITADO_ADMIN: { label: 'Rejeitado', cls: 'bg-red-200 text-red-800' },
}

function tempoAtras(data: Date): string {
  const agora = new Date()
  const diffMs = agora.getTime() - data.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH} hora${diffH !== 1 ? 's' : ''}`
  const diffD = Math.floor(diffH / 24)
  return `há ${diffD} dia${diffD !== 1 ? 's' : ''}`
}

interface PageProps {
  searchParams: Promise<{ tab?: string; page?: string }>
}

const PENDENTES_ESTADOS = [
  EstadoPagamento.COMPROVANTE_SUBMETIDO,
  EstadoPagamento.VALIDADO_AUTO_ALERTA,
  EstadoPagamento.VALIDADO_AUTO_REJEITADO,
]

export default async function PagamentosPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const tab = sp.tab === 'todos' ? 'todos' : 'pendentes'
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

  const pendentes = await db.pagamento.findMany({
    where: { estado: { in: PENDENTES_ESTADOS } },
    include: {
      encomenda: {
        select: {
          referencia: true,
          cliente: { select: { nome: true } },
        },
      },
    },
    orderBy: { criadoEm: 'asc' },
  })

  const pendentesOrdenados = [...pendentes].sort((a, b) => {
    const prioridade = (e: EstadoPagamento) =>
      e === EstadoPagamento.VALIDADO_AUTO_ALERTA ? 0 :
      e === EstadoPagamento.VALIDADO_AUTO_REJEITADO ? 1 : 2
    const diff = prioridade(a.estado) - prioridade(b.estado)
    if (diff !== 0) return diff
    return a.criadoEm.getTime() - b.criadoEm.getTime()
  })

  const where: Prisma.PagamentoWhereInput = {}
  const [todos, totalTodos] = tab === 'todos'
    ? await Promise.all([
        db.pagamento.findMany({
          where,
          include: {
            encomenda: {
              select: {
                referencia: true,
                cliente: { select: { nome: true } },
              },
            },
          },
          orderBy: { criadoEm: 'desc' },
          skip,
          take: limit,
        }),
        db.pagamento.count({ where }),
      ])
    : [[], 0]

  const paginas = Math.ceil(totalTodos / limit)

  const lista = tab === 'todos' ? todos : pendentesOrdenados

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1
          className="text-sm font-normal tracking-widest uppercase text-noir"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Pagamentos
        </h1>
        {tab === 'pendentes' && pendentes.length > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-100">
        <Link
          href="/admin/pagamentos?tab=pendentes"
          className={`px-4 py-2 text-xs tracking-wide transition-colors ${
            tab === 'pendentes'
              ? 'border-b-2 border-noir text-noir font-medium'
              : 'text-muted hover:text-noir'
          }`}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Pendentes ({pendentes.length})
        </Link>
        <Link
          href="/admin/pagamentos?tab=todos"
          className={`px-4 py-2 text-xs tracking-wide transition-colors ${
            tab === 'todos'
              ? 'border-b-2 border-noir text-noir font-medium'
              : 'text-muted hover:text-noir'
          }`}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Todos
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {lista.length === 0 ? (
          <p className="text-center py-12 text-sm text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            {tab === 'pendentes' ? 'Nenhum pagamento pendente.' : 'Nenhum pagamento encontrado.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] tracking-widest uppercase text-muted border-b border-gray-100">
                <th className="px-6 py-3 text-left font-normal">Referência</th>
                <th className="px-4 py-3 text-left font-normal">Cliente</th>
                <th className="px-4 py-3 text-left font-normal">Estado</th>
                <th className="px-4 py-3 text-left font-normal">Score</th>
                <th className="px-4 py-3 text-right font-normal">Tempo</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(pag => {
                const resultado = pag.validacaoScript as unknown as ResultadoValidacao | null
                const score = resultado?.score ?? null
                const scoreColor =
                  score === null ? 'bg-gray-200' :
                  score >= 80 ? 'bg-green-500' :
                  score >= 50 ? 'bg-yellow-400' :
                  'bg-red-500'

                return (
                  <tr
                    key={pag.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/pagamentos/${pag.id}`}
                        className="font-mono text-xs text-noir hover:text-gold transition-colors"
                      >
                        {pag.encomenda.referencia}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {pag.encomenda.cliente.nome}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-medium ${ESTADO_CONFIG[pag.estado].cls}`}
                      >
                        {ESTADO_CONFIG[pag.estado].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {score !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${scoreColor}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted">{score}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted text-right">
                      {tempoAtras(pag.criadoEm)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {tab === 'todos' && paginas > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            Página {page} de {paginas}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/pagamentos?tab=todos&page=${page - 1}`}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Anterior
              </Link>
            )}
            {page < paginas && (
              <Link
                href={`/admin/pagamentos?tab=todos&page=${page + 1}`}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'var(--font-sans)' }}
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
