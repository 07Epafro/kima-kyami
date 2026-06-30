import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { validarComprovante } from '@/lib/validar-comprovante'
import { EstadoPagamento, Prisma } from '@prisma/client'
import { Resend } from 'resend'
import { z } from 'zod'

const schema = z.object({ comprovanteUrl: z.string().url() })

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 400 })
  }

  const { comprovanteUrl } = parsed.data

  const pagamento = await db.pagamento.findUnique({
    where: { id },
    include: { encomenda: true },
  })

  if (!pagamento) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })

  const { encomenda } = pagamento

  const res = await fetch(comprovanteUrl)
  if (!res.ok) {
    return NextResponse.json({ error: 'Não foi possível descarregar o comprovante' }, { status: 422 })
  }

  const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
  const mimeType = contentType.split(';')[0].trim()
  const buffer = Buffer.from(await res.arrayBuffer())

  const resultado = await validarComprovante(buffer, mimeType, {
    total: pagamento.valor,
    referencia: encomenda.referencia,
    criadaEm: encomenda.criadaEm,
  })

  const estadoMap: Record<'OK' | 'ALERTA' | 'REJEITADO', EstadoPagamento> = {
    OK: EstadoPagamento.VALIDADO_AUTO_OK,
    ALERTA: EstadoPagamento.VALIDADO_AUTO_ALERTA,
    REJEITADO: EstadoPagamento.VALIDADO_AUTO_REJEITADO,
  }
  const novoEstado = estadoMap[resultado.estado]

  const pagamentoActualizado = await db.pagamento.update({
    where: { id },
    data: {
      estado: novoEstado,
      comprovante: comprovanteUrl,
      validacaoScript: resultado as unknown as Prisma.InputJsonValue,
      verificadoEm: new Date(),
    },
  })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Ki Ma Kyami Sistema <noreply@kimakyami.com>',
      to: process.env.ADMIN_EMAIL ?? 'admin@kimakyami.com',
      subject: `[Pagamento] ${resultado.estado} — ${encomenda.referencia} (score: ${resultado.score})`,
      html: `<p>Referência: ${encomenda.referencia}<br>Score: ${resultado.score}/100<br>Estado: ${resultado.estado}<br>Alertas: ${resultado.alertas.join(', ') || 'Nenhum'}</p>`,
    })
  } catch {
    /* Email falhou mas validação foi registada — não reverter */
  }

  return NextResponse.json({ resultado, pagamento: pagamentoActualizado })
}
