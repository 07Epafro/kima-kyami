import db from '@/lib/db'
import { EstadoPagamento, EstadoEncomenda } from '@prisma/client'
import { TrendingUp, ShoppingBag, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import SalesChart from '@/components/admin/SalesChart'
import { formatarPreco } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

const estadoLabels: Record<EstadoEncomenda, string> = {
  PENDENTE:          'Pendente',
  PAGAMENTO_ANALISE: 'Em análise',
  CONFIRMADA:        'Confirmada',
  EM_PREPARACAO:     'Em preparação',
  ENVIADA:           'Enviada',
  ENTREGUE:          'Entregue',
  CANCELADA:         'Cancelada',
  DEVOLVIDA:         'Devolvida',
}

const estadoBadge: Record<EstadoEncomenda, string> = {
  PENDENTE:          'bg-amber-50  text-amber-700  border border-amber-200',
  PAGAMENTO_ANALISE: 'bg-blue-50   text-blue-700   border border-blue-200',
  CONFIRMADA:        'bg-green-50  text-green-700  border border-green-200',
  EM_PREPARACAO:     'bg-purple-50 text-purple-700 border border-purple-200',
  ENVIADA:           'bg-indigo-50 text-indigo-700 border border-indigo-200',
  ENTREGUE:          'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELADA:         'bg-red-50    text-red-700    border border-red-200',
  DEVOLVIDA:         'bg-orange-50 text-orange-700 border border-orange-200',
}

function horasAtras(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 0) return `há ${h}h${m > 0 ? ` ${m}m` : ''}`
  return `há ${m}m`
}

function formatarDataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default async function DashboardPage() {
  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
  const ha30Dias  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ha2Horas  = new Date(now.getTime() - 2  * 60 * 60 * 1000)

  const [
    vendasMes, totalEncomendas, totalClientes, pagamentosPendentes,
    encomendas30Dias, ultimasEncomendas, pagamentosUrgentes,
  ] = await Promise.all([
    db.encomenda.aggregate({
      where: { criadaEm: { gte: inicioMes }, estado: { not: EstadoEncomenda.CANCELADA } },
      _sum: { total: true },
    }),
    db.encomenda.count({ where: { criadaEm: { gte: inicioMes } } }),
    db.cliente.count(),
    db.pagamento.count({ where: { estado: EstadoPagamento.COMPROVANTE_SUBMETIDO } }),
    db.encomenda.findMany({
      where: { criadaEm: { gte: ha30Dias }, estado: { not: EstadoEncomenda.CANCELADA } },
      select: { criadaEm: true, total: true },
      orderBy: { criadaEm: 'asc' },
    }),
    db.encomenda.findMany({
      take: 5,
      orderBy: { criadaEm: 'desc' },
      include: { cliente: { select: { nome: true } } },
    }),
    db.pagamento.findMany({
      where: { estado: EstadoPagamento.COMPROVANTE_SUBMETIDO, criadoEm: { lte: ha2Horas } },
      include: { encomenda: { select: { referencia: true } } },
      orderBy: { criadoEm: 'asc' },
    }),
  ])

  const vendasPorDia = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    vendasPorDia.set(d.toISOString().slice(0, 10), 0)
  }
  for (const enc of encomendas30Dias) {
    const key = enc.criadaEm.toISOString().slice(0, 10)
    if (vendasPorDia.has(key)) vendasPorDia.set(key, (vendasPorDia.get(key) ?? 0) + enc.total)
  }
  const vendasDiarias = Array.from(vendasPorDia.entries()).map(([data, total]) => ({ data, total }))

  const kpis = [
    {
      label: 'Vendas este mês',
      valor: formatarPreco(vendasMes._sum.total ?? 0),
      icon: TrendingUp,
      iconCls: 'text-a-gold',
      iconBg:  'bg-a-gold/10',
    },
    {
      label: 'Encomendas este mês',
      valor: totalEncomendas.toString(),
      icon: ShoppingBag,
      iconCls: 'text-blue-600',
      iconBg:  'bg-blue-50',
    },
    {
      label: 'Clientes',
      valor: totalClientes.toString(),
      icon: Users,
      iconCls: 'text-emerald-600',
      iconBg:  'bg-emerald-50',
    },
    {
      label: 'Pagamentos pendentes',
      valor: pagamentosPendentes.toString(),
      icon: Clock,
      iconCls: pagamentosPendentes > 0 ? 'text-red-500'  : 'text-a-muted',
      iconBg:  pagamentosPendentes > 0 ? 'bg-red-50'     : 'bg-a-border/30',
    },
  ]

  return (
    <div className="space-y-5">

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, valor, icon: Icon, iconCls, iconBg }) => (
          <div key={label} className="bg-white border border-a-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-5">
              <p className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted font-ui leading-tight max-w-30">
                {label}
              </p>
              <div className={`w-8 h-8 rounded ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={15} strokeWidth={1.5} className={iconCls} />
              </div>
            </div>
            <p className="text-3xl font-light text-a-charcoal font-display leading-none tracking-tight">
              {valor}
            </p>
          </div>
        ))}
      </div>

      {/* Sales chart */}
      <div className="bg-white border border-a-border rounded-lg p-6">
        <h2 className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted mb-6 font-ui">
          Vendas — últimos 30 dias
        </h2>
        <SalesChart data={vendasDiarias} />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Recent orders */}
        <div className="bg-white border border-a-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-a-border flex items-center justify-between">
            <h2 className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted font-ui">
              Últimas encomendas
            </h2>
            <Link href="/admin/encomendas" className="text-[10px] text-a-gold hover:underline font-ui tracking-wide">
              Ver todas
            </Link>
          </div>
          {ultimasEncomendas.length === 0 ? (
            <p className="px-6 py-8 text-sm text-a-muted text-center font-ui">Sem encomendas ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[9.5px] tracking-[0.18em] uppercase text-a-muted border-b border-a-border font-ui">
                    <th className="px-6 py-3 text-left font-normal">Ref.</th>
                    <th className="px-4 py-3 text-left font-normal hidden sm:table-cell">Cliente</th>
                    <th className="px-4 py-3 text-right font-normal">Total</th>
                    <th className="px-4 py-3 text-left font-normal">Estado</th>
                    <th className="px-4 py-3 text-right font-normal hidden sm:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasEncomendas.map((enc) => (
                    <tr key={enc.id} className="border-b border-a-border/50 hover:bg-a-bone transition-colors last:border-0">
                      <td className="px-6 py-3">
                        <Link href={`/admin/encomendas/${enc.id}`} className="font-mono text-xs text-a-charcoal hover:text-a-gold transition-colors">
                          {enc.referencia}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-a-muted truncate max-w-28 hidden sm:table-cell">{enc.cliente.nome}</td>
                      <td className="px-4 py-3 text-xs text-right font-medium text-a-charcoal font-ui">{formatarPreco(enc.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-medium font-ui ${estadoBadge[enc.estado]}`}>
                          {estadoLabels[enc.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-a-muted text-right font-ui hidden sm:table-cell">{formatarDataCurta(enc.criadaEm.toISOString())}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payments to validate */}
        <div className="bg-white border border-a-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-a-border flex items-center justify-between">
            <h2 className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted font-ui">
              Pagamentos a validar
            </h2>
            <Link href="/admin/pagamentos" className="text-[10px] text-a-gold hover:underline font-ui tracking-wide">
              Ver todos
            </Link>
          </div>
          {pagamentosUrgentes.length === 0 ? (
            <p className="px-6 py-8 text-sm text-a-muted text-center font-ui">Nenhum comprovante pendente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[9.5px] tracking-[0.18em] uppercase text-a-muted border-b border-a-border font-ui">
                    <th className="px-6 py-3 text-left font-normal">Encomenda</th>
                    <th className="px-4 py-3 text-right font-normal">Valor</th>
                    <th className="px-4 py-3 text-right font-normal">Aguarda</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosUrgentes.map((p) => (
                    <tr key={p.id} className="border-b border-a-border/50 hover:bg-red-50/40 transition-colors last:border-0">
                      <td className="px-6 py-3">
                        <Link href={`/admin/pagamentos/${p.id}`} className="font-mono text-xs text-a-charcoal hover:text-a-gold transition-colors">
                          {p.encomenda.referencia}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-medium text-a-charcoal font-ui">{formatarPreco(p.valor)}</td>
                      <td className="px-4 py-3 text-[10px] text-red-500 text-right font-medium font-ui">
                        {horasAtras(p.criadoEm.toISOString())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
