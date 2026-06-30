import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  const encomendasValidas = cliente.encomendas.filter((e) => e.estado !== 'CANCELADA')
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

  await resend.emails.send({
    from: 'Ki Ma Kyami <noreply@kimakyami.com>',
    to: cliente.email,
    subject: parsed.data.assunto,
    html: `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:580px">
        <tr>
          <td style="background:#181818;padding:28px 40px;text-align:center">
            <p style="margin:0;font-size:28px;letter-spacing:10px;color:#f7c480;font-weight:300">KK</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 16px;font-size:14px;color:#181818;line-height:1.8;font-family:Arial,sans-serif">
              Olá <strong>${cliente.nome}</strong>,
            </p>
            <p style="margin:0;font-size:14px;color:#181818;line-height:1.8;font-family:Arial,sans-serif;white-space:pre-wrap">${parsed.data.mensagem}</p>
            <hr style="border:none;border-top:1px solid #e8e0d8;margin:32px 0">
            <p style="margin:0;font-size:11px;color:#9a9a9a;font-family:Arial,sans-serif;text-align:center">
              Ki Ma Kyami · <a href="mailto:hello@kimakyami.com" style="color:#9a9a9a">hello@kimakyami.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })

  return NextResponse.json({ ok: true })
}
