import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { EstadoEncomenda, EstadoPagamento, Prisma } from '@prisma/client'
import { z } from 'zod'
import { emailConfirmacaoEncomenda } from '@/lib/email'
import { gerarReferencia } from '@/lib/utils'

// ── Store: create order ──────────────────────────────────────────

const itemSchema = z.object({
  produtoId: z.string(),
  tamanho: z.number().int().min(35).max(45),
  cor: z.string().min(1),
  quantidade: z.number().int().positive(),
})

const criarSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().optional(),
  moradaRua: z.string().min(1),
  moradaNumero: z.string().optional(),
  moradaCidade: z.string().min(1),
  moradaCp: z.string().min(3),
  moradaPais: z.string().default('Angola'),
  itens: z.array(itemSchema).min(1),
})

function stockKey(tamanho: number, cor: string) { return `${tamanho}-${cor}` }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = criarSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { nome, email, telefone, moradaRua, moradaNumero, moradaCidade, moradaCp, moradaPais, itens } = parsed.data

  const produtoIds = [...new Set(itens.map(i => i.produtoId))]
  const produtos = await db.produto.findMany({
    where: { id: { in: produtoIds }, ativo: true },
    select: { id: true, nome: true, preco: true, stock: true, emBreve: true },
  })
  const produtoMap = new Map(produtos.map(p => [p.id, p]))

  for (const item of itens) {
    const p = produtoMap.get(item.produtoId)
    if (!p) return NextResponse.json({ error: `Produto não encontrado: ${item.produtoId}` }, { status: 422 })
    if (p.emBreve) return NextResponse.json({ error: `${p.nome} ainda não está disponível` }, { status: 422 })
    const disponivel = ((p.stock as Record<string, number>)[stockKey(item.tamanho, item.cor)]) ?? 0
    if (disponivel < item.quantidade) {
      return NextResponse.json(
        { error: `Stock insuficiente: ${p.nome} (${item.cor}, nº${item.tamanho}). Disponível: ${disponivel}` },
        { status: 422 },
      )
    }
  }

  const subtotal = itens.reduce((s, i) => s + (produtoMap.get(i.produtoId)?.preco ?? 0) * i.quantidade, 0)
  const portes = subtotal >= 50000 ? 0 : 3500
  const total = subtotal + portes
  const moradaEnvio = {
    rua: moradaNumero ? `${moradaRua}, ${moradaNumero}` : moradaRua,
    codigoPostal: moradaCp,
    cidade: moradaCidade,
    pais: moradaPais,
  }

  const result = await db.$transaction(async (tx) => {
    const cliente = await tx.cliente.upsert({
      where: { email },
      create: { nome, email, telefone: telefone ?? null, morada: moradaEnvio },
      update: { nome, ...(telefone ? { telefone } : {}) },
    })

    const enc = await tx.encomenda.create({
      data: {
        referencia: 'TEMP',
        clienteId: cliente.id,
        subtotal,
        portes,
        total,
        moradaEnvio,
        itens: {
          create: itens.map(item => ({
            produtoId: item.produtoId,
            tamanho: item.tamanho,
            cor: item.cor,
            quantidade: item.quantidade,
            precoUnit: produtoMap.get(item.produtoId)?.preco ?? 0,
          })),
        },
      },
    })

    const referencia = gerarReferencia(enc.id)
    await tx.encomenda.update({ where: { id: enc.id }, data: { referencia } })

    const pagamento = await tx.pagamento.create({
      data: {
        encomendaId: enc.id,
        valor: total,
        ibanDestinatario: process.env.IBAN_LOJA ?? '',
        referencia,
        estado: EstadoPagamento.AGUARDA_COMPROVANTE,
      },
    })

    for (const item of itens) {
      const prod = await tx.produto.findUnique({ where: { id: item.produtoId }, select: { stock: true } })
      if (!prod) continue
      const stock = { ...(prod.stock as Record<string, number>) }
      const key = stockKey(item.tamanho, item.cor)
      stock[key] = Math.max(0, (stock[key] ?? 0) - item.quantidade)
      await tx.produto.update({ where: { id: item.produtoId }, data: { stock: stock as Prisma.InputJsonValue } })
    }

    return { enc, referencia, pagamentoId: pagamento.id, cliente }
  })

  try {
    await emailConfirmacaoEncomenda(
      {
        referencia: result.referencia,
        total,
        subtotal,
        portes,
        iban: process.env.IBAN_LOJA ?? '',
        titular: process.env.TITULAR_LOJA ?? 'Kima Kyami',
        itens: itens.map(i => ({
          nome: produtoMap.get(i.produtoId)?.nome ?? i.produtoId,
          tamanho: i.tamanho,
          cor: i.cor,
          quantidade: i.quantidade,
          precoUnit: produtoMap.get(i.produtoId)?.preco ?? 0,
        })),
        moradaEnvio,
      },
      { nome, email },
    )
  } catch { /* email failed — order created */ }

  return NextResponse.json({
    encomendaId: result.enc.id,
    pagamentoId: result.pagamentoId,
    referencia: result.referencia,
    iban: process.env.IBAN_LOJA ?? '',
    titular: process.env.TITULAR_LOJA ?? 'Kima Kyami',
    valor: total,
  }, { status: 201 })
}

export const revalidate = 0

function buildWhere(params: URLSearchParams): Prisma.EncomendaWhereInput {
  const where: Prisma.EncomendaWhereInput = {}

  const estado = params.get('estado')
  if (estado && Object.values(EstadoEncomenda).includes(estado as EstadoEncomenda)) {
    where.estado = estado as EstadoEncomenda
  }

  const search = params.get('search')?.trim()
  if (search) {
    where.OR = [
      { referencia: { contains: search, mode: 'insensitive' } },
      { cliente: { nome: { contains: search, mode: 'insensitive' } } },
      { cliente: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const de = params.get('de')
  const ate = params.get('ate')
  if (de || ate) {
    where.criadaEm = {}
    if (de) where.criadaEm.gte = new Date(de)
    if (ate) {
      const ateDate = new Date(ate)
      ateDate.setHours(23, 59, 59, 999)
      where.criadaEm.lte = ateDate
    }
  }

  return where
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const params = req.nextUrl.searchParams
  const format = params.get('format')
  const where = buildWhere(params)

  if (format === 'csv') {
    const encomendas = await db.encomenda.findMany({
      where,
      orderBy: { criadaEm: 'desc' },
      include: { cliente: { select: { nome: true, email: true } } },
    })

    const linhas = [
      ['Referência', 'Cliente', 'Email', 'Total', 'Estado', 'Data'].join(';'),
      ...encomendas.map((e) =>
        [
          e.referencia,
          e.cliente.nome,
          e.cliente.email,
          e.total.toFixed(2).replace('.', ','),
          e.estado,
          e.criadaEm.toISOString().slice(0, 10),
        ].join(';')
      ),
    ]

    return new NextResponse(linhas.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="encomendas.csv"',
      },
    })
  }

  const page = Math.max(1, parseInt(params.get('page') ?? '1'))
  const limit = Math.min(50, parseInt(params.get('limit') ?? '20'))
  const skip = (page - 1) * limit

  const [encomendas, total] = await Promise.all([
    db.encomenda.findMany({
      where,
      skip,
      take: limit,
      orderBy: { criadaEm: 'desc' },
      include: {
        cliente: { select: { nome: true, email: true } },
        _count: { select: { itens: true } },
      },
    }),
    db.encomenda.count({ where }),
  ])

  return NextResponse.json({
    encomendas,
    total,
    paginas: Math.ceil(total / limit),
    paginaActual: page,
  })
}
