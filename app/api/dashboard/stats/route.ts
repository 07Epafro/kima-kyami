import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { EstadoPagamento } from '@prisma/client'

export const revalidate = 60

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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
      where: { criadaEm: { gte: inicioMes }, estado: { not: 'CANCELADA' } },
      _sum: { total: true },
    }),
    db.encomenda.count({ where: { criadaEm: { gte: inicioMes } } }),
    db.cliente.count(),
    db.pagamento.count({ where: { estado: EstadoPagamento.COMPROVANTE_SUBMETIDO } }),
    db.encomenda.findMany({
      where: { criadaEm: { gte: ha30Dias }, estado: { not: 'CANCELADA' } },
      select: { criadaEm: true, total: true },
      orderBy: { criadaEm: 'asc' },
    }),
    db.encomenda.findMany({
      take: 5,
      orderBy: { criadaEm: 'desc' },
      include: { cliente: { select: { nome: true } } },
    }),
    db.pagamento.findMany({
      where: {
        estado: EstadoPagamento.COMPROVANTE_SUBMETIDO,
        criadoEm: { lte: ha2Horas },
      },
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

  return NextResponse.json({
    totalVendasMes: vendasMes._sum.total ?? 0,
    totalEncomendas,
    totalClientes,
    pagamentosPendentes,
    vendasDiarias: Array.from(vendasPorDia.entries()).map(([data, total]) => ({ data, total })),
    ultimasEncomendas: ultimasEncomendas.map((e) => ({
      id: e.id,
      referencia: e.referencia,
      cliente: e.cliente.nome,
      total: e.total,
      estado: e.estado,
      criadaEm: e.criadaEm.toISOString(),
    })),
    pagamentosUrgentes: pagamentosUrgentes.map((p) => ({
      id: p.id,
      referencia: p.encomenda.referencia,
      valor: p.valor,
      criadoEm: p.criadoEm.toISOString(),
    })),
  })
}
