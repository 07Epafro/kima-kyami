import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { Prisma } from '@prisma/client'

export const revalidate = 0

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const params = req.nextUrl.searchParams
  const format = params.get('format')
  const search = params.get('search')?.trim()
  const sort = params.get('sort') ?? 'criadoEm'
  const order = params.get('order') === 'asc' ? 'asc' : 'desc'

  const where: Prisma.ClienteWhereInput = search
    ? {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {}

  const orderBy: Prisma.ClienteOrderByWithRelationInput =
    sort === 'nome'
      ? { nome: order }
      : sort === 'encomendas'
        ? { encomendas: { _count: order } }
        : { criadoEm: order }

  if (format === 'csv') {
    const clientes = await db.cliente.findMany({
      where,
      orderBy,
      include: {
        _count: { select: { encomendas: true } },
        encomendas: {
          where: { estado: { not: 'CANCELADA' } },
          select: { total: true, criadaEm: true },
          orderBy: { criadaEm: 'desc' },
        },
      },
    })

    const linhas = [
      ['Nome', 'Email', 'Telefone', 'Nº Encomendas', 'Total Gasto', 'Última Compra'].join(';'),
      ...clientes.map((c) => {
        const totalGasto = c.encomendas.reduce((s, e) => s + e.total, 0)
        const ultimaCompra = c.encomendas[0]?.criadaEm?.toISOString().slice(0, 10) ?? ''
        return [
          c.nome,
          c.email,
          c.telefone ?? '',
          c._count.encomendas,
          totalGasto.toFixed(2).replace('.', ','),
          ultimaCompra,
        ].join(';')
      }),
    ]

    return new NextResponse(linhas.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="clientes.csv"',
      },
    })
  }

  const page = Math.max(1, parseInt(params.get('page') ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

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
        },
      },
    }),
    db.cliente.count({ where }),
  ])

  const resultado = clientes.map((c) => ({
    id: c.id,
    nome: c.nome,
    email: c.email,
    telefone: c.telefone,
    nEncomendas: c._count.encomendas,
    totalGasto: c.encomendas.reduce((s, e) => s + e.total, 0),
    ultimaCompra: c.encomendas[0]?.criadaEm ?? null,
  }))

  return NextResponse.json({
    clientes: resultado,
    total,
    paginas: Math.ceil(total / limit),
    paginaActual: page,
  })
}
