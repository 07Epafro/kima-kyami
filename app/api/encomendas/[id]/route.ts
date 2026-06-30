import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { EstadoEncomenda } from '@prisma/client'
import {
  emailEncomendaConfirmada,
  emailEncomendaEnviada,
  emailEncomendaCancelada,
} from '@/lib/email'
import { z } from 'zod'

const TRANSICOES: Record<EstadoEncomenda, EstadoEncomenda[]> = {
  PENDENTE: ['PAGAMENTO_ANALISE', 'CANCELADA'],
  PAGAMENTO_ANALISE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EM_PREPARACAO', 'CANCELADA'],
  EM_PREPARACAO: ['ENVIADA', 'CANCELADA'],
  ENVIADA: ['ENTREGUE'],
  ENTREGUE: ['DEVOLVIDA'],
  CANCELADA: [],
  DEVOLVIDA: [],
}

const patchSchema = z.object({
  estado: z.nativeEnum(EstadoEncomenda).optional(),
  notas: z.string().optional(),
  numeroTracking: z.string().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const encomenda = await db.encomenda.findUnique({
    where: { id },
    include: {
      cliente: true,
      pagamento: true,
      itens: {
        include: { produto: { select: { nome: true, imagens: true, slug: true } } },
      },
    },
  })

  if (!encomenda) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

  return NextResponse.json(encomenda)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 400 })
  }

  const { estado: novoEstado, notas, numeroTracking } = parsed.data

  const encomenda = await db.encomenda.findUnique({
    where: { id },
    include: {
      cliente: true,
      itens: {
        include: { produto: { select: { nome: true } } },
      },
    },
  })

  if (!encomenda) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

  if (novoEstado && novoEstado !== encomenda.estado) {
    const validos = TRANSICOES[encomenda.estado]
    if (!validos.includes(novoEstado)) {
      return NextResponse.json(
        { error: `Transição inválida: ${encomenda.estado} → ${novoEstado}` },
        { status: 422 }
      )
    }
    if (novoEstado === 'ENVIADA' && !numeroTracking) {
      return NextResponse.json({ error: 'Número de tracking obrigatório para envio' }, { status: 422 })
    }
  }

  const encomendaActualizada = await db.encomenda.update({
    where: { id },
    data: {
      ...(novoEstado ? { estado: novoEstado } : {}),
      ...(notas !== undefined ? { notas } : {}),
      ...(numeroTracking !== undefined ? { numeroTracking } : {}),
    },
  })

  if (novoEstado && novoEstado !== encomenda.estado) {
    const moradaEnvio = encomenda.moradaEnvio as {
      rua: string
      codigoPostal: string
      cidade: string
      pais: string
    }

    const encEmail = {
      referencia: encomenda.referencia,
      total: encomenda.total,
      subtotal: encomenda.subtotal,
      portes: encomenda.portes,
      itens: encomenda.itens.map((i) => ({
        nome: i.produto?.nome ?? 'Produto',
        tamanho: i.tamanho,
        cor: i.cor,
        quantidade: i.quantidade,
        precoUnit: i.precoUnit,
      })),
      moradaEnvio,
    }

    const cliente = { nome: encomenda.cliente.nome, email: encomenda.cliente.email }

    try {
      if (novoEstado === 'CONFIRMADA') {
        await emailEncomendaConfirmada(encEmail, cliente)
      } else if (novoEstado === 'ENVIADA' && numeroTracking) {
        await emailEncomendaEnviada(encEmail, cliente, numeroTracking)
      } else if (novoEstado === 'CANCELADA') {
        await emailEncomendaCancelada(encEmail, cliente, notas)
      }
    } catch {
      // Email falhou mas estado foi actualizado — não reverter
    }
  }

  return NextResponse.json(encomendaActualizada)
}
