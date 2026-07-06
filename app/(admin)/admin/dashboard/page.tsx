import db from '@/lib/db'
import { EstadoPagamento, EstadoEncomenda } from '@prisma/client'
import { TrendingUp, ShoppingBag, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import SalesChart from '@/components/admin/SalesChart'
import { formatarPreco } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

const estadoLabels: Record<EstadoEncomenda, string> = {
  PENDENTE: 'Pendente',
  PAGAMENTO_ANALISE: 'Em análise',
  CONFIRMADA: 'Confirmada',
  EM_PREPARACAO: 'Em preparação',
  ENVIADA: 'Enviada',
  ENTREGUE: 'Entregue',
  CANCELADA: 'Cancelada',
  DEVOLVIDA: 'Devolvida',
}

const estadoCores: Record<EstadoEncomenda, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700',
  PAGAMENTO_ANALISE: 'bg-blue-100 text-blue-700',
  CONFIRMADA: 'bg-green-100 text-green-700',
  EM_PREPARACAO: 'bg-purple-100 text-purple-700',
  ENVIADA: 'bg-indigo-100 text-indigo-700',
  ENTREGUE: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-red-100 text-red-700',
  DEVOLVIDA: 'bg-orange-100 text-orange-700',
}

function horasAtras(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `há ${h}h${m > 0 ? ` ${m}m` : ''}`
  return `há ${m}m`
}

function formatarDataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default async function DashboardPage() {
  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
  const ha30Dias = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ha2Horas = new Date(now.getTime() - 2 * 60 * 60 * 1000)

  const [
    vendasMes,
    totalEncomendas,
    totalClientes,
    pagamentosPendentes,
    encomendas30Dias,
    ultimasEncomendas,
    pagamentosUrgentes,
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
    if (vendasPorDia.has(key)) {
      vendasPorDia.set(key, (vendasPorDia.get(key) ?? 0) + enc.total)
    }
  }
  const vendasDiarias = Array.from(vendasPorDia.entries()).map(([data, total]) => ({ data, total }))

  const kpis = [
    {
      label: 'Vendas este mês',
      valor: formatarPreco(vendasMes._sum.total ?? 0),
      icon: TrendingUp,
      cor: 'text-gold',
      bg: 'bg-gold/10',
    },
    {
      label: 'Encomendas este mês',
      valor: totalEncomendas.toString(),
      icon: ShoppingBag,
      cor: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Clientes',
      valor: totalClientes.toString(),
      icon: Users,
      cor: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Pagamentos pendentes',
      valor: pagamentosPendentes.toString(),
      icon: Clock,
      cor: pagamentosPendentes > 0 ? 'text-red-500' : 'text-gray-400',
      bg: pagamentosPendentes > 0 ? 'bg-red-50' : 'bg-gray-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, valor, icon: Icon, cor, bg }) => (
          <div key={label} className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs tracking-spaced-lg uppercase text-muted font-sans">
                {label}
              </span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={16} className={cor} />
              </div>
            </div>
            <p className="text-2xl font-light text-noir font-serif">
              {valor}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h2 className="text-xs tracking-spaced-lg uppercase text-muted mb-6 font-sans">
          Vendas — últimos 30 dias
        </h2>
        <SalesChart data={vendasDiarias} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs tracking-spaced-lg uppercase text-muted font-sans">
              Últimas encomendas
            </h2>
            <Link href="/admin/encomendas" className="text-xs text-gold hover:underline font-sans">
              Ver todas
            </Link>
          </div>
          {ultimasEncomendas.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted text-center">Sem encomendas ainda.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-spaced-xl uppercase text-muted border-b border-gray-50 font-sans">
                  <th className="px-6 py-3 text-left font-normal">Ref.</th>
                  <th className="px-4 py-3 text-left font-normal">Cliente</th>
                  <th className="px-4 py-3 text-right font-normal">Total</th>
                  <th className="px-4 py-3 text-left font-normal">Estado</th>
                  <th className="px-4 py-3 text-right font-normal">Data</th>
                </tr>
              </thead>
              <tbody>
                {ultimasEncomendas.map((enc) => (
                  <tr key={enc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/admin/encomendas/${enc.id}`} className="font-mono text-xs text-noir hover:text-gold">
                        {enc.referencia}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted truncate max-w-[120px]">{enc.cliente.nome}</td>
                    <td className="px-4 py-3 text-xs text-right font-medium text-noir">{formatarPreco(enc.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${estadoCores[enc.estado]}`}>
                        {estadoLabels[enc.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted text-right">{formatarDataCurta(enc.criadaEm.toISOString())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs tracking-spaced-lg uppercase text-muted font-sans">
              Pagamentos a validar
            </h2>
            <Link href="/admin/pagamentos" className="text-xs text-gold hover:underline font-sans">
              Ver todos
            </Link>
          </div>
          {pagamentosUrgentes.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted text-center">Nenhum comprovante pendente.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-spaced-xl uppercase text-muted border-b border-gray-50 font-sans">
                  <th className="px-6 py-3 text-left font-normal">Encomenda</th>
                  <th className="px-4 py-3 text-right font-normal">Valor</th>
                  <th className="px-4 py-3 text-right font-normal">Submetido</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosUrgentes.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/admin/pagamentos/${p.id}`} className="font-mono text-xs text-noir hover:text-gold">
                        {p.encomenda.referencia}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-medium text-noir">{formatarPreco(p.valor)}</td>
                    <td className="px-4 py-3 text-[10px] text-red-500 text-right font-medium">
                      {horasAtras(p.criadoEm.toISOString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
