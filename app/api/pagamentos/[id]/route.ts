import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { EstadoPagamento, EstadoEncomenda } from '@prisma/client'
import { emailEncomendaConfirmada, emailEncomendaCancelada } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  validacaoAdmin: z.boolean(),
  notaAdmin: z.string().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = z.object({ comprovante: z.string().url() }).safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'URL do comprovante inválida' }, { status: 400 })
  }

  const pagamento = await db.pagamento.findUnique({ where: { id }, select: { id: true } })
  if (!pagamento) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const updated = await db.pagamento.update({
    where: { id },
    data: {
      comprovante: parsed.data.comprovante,
      estado: EstadoPagamento.COMPROVANTE_SUBMETIDO,
    },
  })

  return NextResponse.json(updated)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 400 })
  }

  const { validacaoAdmin, notaAdmin } = parsed.data

  if (validacaoAdmin === false && !notaAdmin) {
    return NextResponse.json({ error: 'Nota obrigatória ao rejeitar pagamento' }, { status: 422 })
  }

  const pagamento = await db.pagamento.findUnique({
    where: { id },
    include: {
      encomenda: {
        include: {
          cliente: true,
          itens: {
            include: { produto: { select: { nome: true } } },
          },
        },
      },
    },
  })

  if (!pagamento) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })

  const { encomenda } = pagamento

  if (validacaoAdmin === true) {
    const [pagamentoActualizado] = await db.$transaction([
      db.pagamento.update({
        where: { id },
        data: {
          estado: EstadoPagamento.CONFIRMADO_ADMIN,
          validacaoAdmin: true,
          notaAdmin: notaAdmin ?? null,
          verificadoEm: new Date(),
        },
      }),
      db.encomenda.update({
        where: { id: encomenda.id },
        data: { estado: EstadoEncomenda.CONFIRMADA },
      }),
    ])

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
      itens: encomenda.itens.map(i => ({
        nome: i.produto?.nome ?? 'Produto',
        tamanho: i.tamanho,
        cor: i.cor,
        quantidade: i.quantidade,
        precoUnit: i.precoUnit,
      })),
      moradaEnvio,
    }

    const clienteEmail = { nome: encomenda.cliente.nome, email: encomenda.cliente.email }

    try {
      await emailEncomendaConfirmada(encEmail, clienteEmail)
    } catch {
      /* Email falhou mas estado foi actualizado — não reverter */
    }

    return NextResponse.json(pagamentoActualizado)
  } else {
    const pagamentoActualizado = await db.pagamento.update({
      where: { id },
      data: {
        estado: EstadoPagamento.REJEITADO_ADMIN,
        validacaoAdmin: false,
        notaAdmin: notaAdmin ?? null,
      },
    })

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
      itens: encomenda.itens.map(i => ({
        nome: i.produto?.nome ?? 'Produto',
        tamanho: i.tamanho,
        cor: i.cor,
        quantidade: i.quantidade,
        precoUnit: i.precoUnit,
      })),
      moradaEnvio,
    }

    const clienteEmail = { nome: encomenda.cliente.nome, email: encomenda.cliente.email }

    try {
      await emailEncomendaCancelada(encEmail, clienteEmail, notaAdmin)
    } catch {
      /* Email falhou mas estado foi actualizado — não reverter */
    }

    return NextResponse.json(pagamentoActualizado)
  }
}
