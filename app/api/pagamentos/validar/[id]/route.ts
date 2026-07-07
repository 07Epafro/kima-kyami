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

  let resultado: Awaited<ReturnType<typeof validarComprovante>> | null = null
  try {
    resultado = await validarComprovante(buffer, mimeType, {
      total: pagamento.valor,
      referencia: encomenda.referencia,
      criadaEm: encomenda.criadaEm,
    })
  } catch (err) {
    console.error('[validar-comprovante] OCR falhou — revisão manual necessária', err)
  }

  let novoEstado: EstadoPagamento
  let validacaoScript: Prisma.InputJsonValue

  if (resultado) {
    const estadoMap: Record<'OK' | 'ALERTA' | 'REJEITADO', EstadoPagamento> = {
      OK: EstadoPagamento.VALIDADO_AUTO_OK,
      ALERTA: EstadoPagamento.VALIDADO_AUTO_ALERTA,
      REJEITADO: EstadoPagamento.VALIDADO_AUTO_REJEITADO,
    }
    novoEstado = estadoMap[resultado.estado]
    validacaoScript = resultado as unknown as Prisma.InputJsonValue
  } else {
    novoEstado = EstadoPagamento.COMPROVANTE_SUBMETIDO
    validacaoScript = { erro: 'OCR indisponível — revisão manual necessária' }
  }

  const pagamentoActualizado = await db.pagamento.update({
    where: { id },
    data: {
      estado: novoEstado,
      comprovante: comprovanteUrl,
      validacaoScript,
      verificadoEm: new Date(),
    },
  })

  const fromAddr = process.env.EMAIL_FROM ?? 'Kima Kyami <noreply@kimakyami.ao>'
  const adminEmail = process.env.ADMIN_EMAIL ?? 'geral@kimakyami.ao'
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    if (resultado) {
      await resend.emails.send({
        from: fromAddr,
        to: adminEmail,
        subject: `[Pagamento] ${resultado.estado} — ${encomenda.referencia} (score: ${resultado.score})`,
        html: `<p>Referência: ${encomenda.referencia}<br>Score: ${resultado.score}/100<br>Estado: ${resultado.estado}<br>Alertas: ${resultado.alertas.join(', ') || 'Nenhum'}</p>`,
      })
    } else {
      await resend.emails.send({
        from: fromAddr,
        to: adminEmail,
        subject: `[Pagamento] Revisão manual — ${encomenda.referencia}`,
        html: `<p>Referência: ${encomenda.referencia}<br>OCR falhou — valida manualmente o comprovante no painel de admin.</p>`,
      })
    }
  } catch {
    /* Email falhou mas validação foi registada — não reverter */
  }

  return NextResponse.json({ resultado, pagamento: pagamentoActualizado })
}
