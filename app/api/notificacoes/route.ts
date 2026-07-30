import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({
  email: z.string().email(),
  produtoId: z.string(),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: 'Demasiados pedidos. Tenta novamente em breve.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { email, produtoId } = parsed.data

  function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'Kima Kyami <noreply@kimakyami.ao>',
      to: process.env.ADMIN_EMAIL ?? 'geral@kimakyami.ao',
      subject: `[Notificação] Nova subscrição de disponibilidade`,
      html: `<p>Email: ${esc(email)}<br>ProdutoId: ${esc(produtoId)}</p>`,
    })
  } catch { /* silent */ }

  return NextResponse.json({ ok: true })
}
