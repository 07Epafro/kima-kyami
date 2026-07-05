import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const schema = z.object({
  email: z.string().email(),
  produtoId: z.string(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { email, produtoId } = parsed.data

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Kima Kyami <noreply@kimakyami.com>',
      to: process.env.ADMIN_EMAIL ?? 'admin@kimakyami.com',
      subject: `[Notificação] Nova subscrição de disponibilidade`,
      html: `<p>Email: ${email}<br>ProdutoId: ${produtoId}</p>`,
    })
  } catch { /* silent */ }

  return NextResponse.json({ ok: true })
}
