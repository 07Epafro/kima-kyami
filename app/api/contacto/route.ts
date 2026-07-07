import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email(),
  assunto: z.string().min(2).max(200),
  mensagem: z.string().min(10).max(2000),
})

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: 'Demasiados pedidos. Tenta novamente em breve.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta.' }, { status: 400 })
  }

  const { nome, email, assunto, mensagem } = parsed.data

  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'Kima Kyami <noreply@kimakyami.ao>',
        to: [process.env.ADMIN_EMAIL ?? 'geral@kimakyami.ao'],
        replyTo: email,
        subject: `[Contacto] ${esc(assunto)}`,
        html: `
          <p><strong>Nome:</strong> ${esc(nome)}</p>
          <p><strong>Email:</strong> ${esc(email)}</p>
          <p><strong>Assunto:</strong> ${esc(assunto)}</p>
          <hr />
          <p>${esc(mensagem).replace(/\n/g, '<br />')}</p>
        `,
      })
    } else {
      console.log('[contacto]', { nome, email, assunto })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contacto]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
