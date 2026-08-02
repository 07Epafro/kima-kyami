import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { z } from 'zod'
import { ESTADOS_ENCOMENDA_PAGA } from '@/lib/encomenda-transicoes'
import { emailMensagemCliente } from '@/lib/email'

const patchSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telefone: z.string().nullable().optional(),
  morada: z
    .object({
      rua: z.string(),
      numero: z.string().optional(),
      codigoPostal: z.string(),
      cidade: z.string(),
      pais: z.string(),
    })
    .nullable()
    .optional(),
  notas: z.string().nullable().optional(),
})

const emailSchema = z.object({
  assunto: z.string().min(1),
  mensagem: z.string().min(1),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const cliente = await db.cliente.findUnique({
    where: { id },
    include: {
      encomendas: {
        orderBy: { criadaEm: 'desc' },
        include: {
          _count: { select: { itens: true } },
          itens: {
            include: { produto: { select: { categoria: true } } },
          },
        },
      },
    },
  })

  if (!cliente) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const encomendasValidas = cliente.encomendas.filter((e) => ESTADOS_ENCOMENDA_PAGA.includes(e.estado))
  const totalGasto = encomendasValidas.reduce((s, e) => s + e.total, 0)
  const encomendaMedia = encomendasValidas.length > 0 ? totalGasto / encomendasValidas.length : 0

  const contCategoria: Record<string, number> = {}
  for (const enc of encomendasValidas) {
    for (const item of enc.itens) {
      const cat = item.produto?.categoria ?? 'OUTRO'
      contCategoria[cat] = (contCategoria[cat] ?? 0) + item.quantidade
    }
  }
  const categoriasPreferidas = Object.entries(contCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([categoria, quantidade]) => ({ categoria, quantidade }))

  return NextResponse.json({
    ...cliente,
    stats: {
      totalGasto,
      encomendaMedia,
      nEncomendas: cliente.encomendas.length,
      categoriasPreferidas,
    },
  })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const existe = await db.cliente.findUnique({ where: { id }, select: { id: true } })
  if (!existe) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (parsed.data.email) {
    const emailEmUso = await db.cliente.findFirst({
      where: { email: parsed.data.email, id: { not: id } },
      select: { id: true },
    })
    if (emailEmUso) {
      return NextResponse.json({ error: 'Email já em uso por outro cliente' }, { status: 409 })
    }
  }

  const cliente = await db.cliente.update({
    where: { id },
    data: {
      ...(parsed.data.nome !== undefined ? { nome: parsed.data.nome } : {}),
      ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
      ...(parsed.data.telefone !== undefined ? { telefone: parsed.data.telefone } : {}),
      ...(parsed.data.morada !== undefined ? { morada: parsed.data.morada ?? undefined } : {}),
      ...(parsed.data.notas !== undefined ? { notas: parsed.data.notas } : {}),
    },
  })

  return NextResponse.json(cliente)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = emailSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const cliente = await db.cliente.findUnique({ where: { id }, select: { nome: true, email: true } })
  if (!cliente) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  try {
    await emailMensagemCliente(cliente, parsed.data.assunto, parsed.data.mensagem)
  } catch {
    return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
