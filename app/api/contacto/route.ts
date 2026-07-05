import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { nome, email, assunto, mensagem } = await req.json()

    if (!nome || !email || !assunto || !mensagem) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta.' }, { status: 400 })
    }

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'Kima Kyami <noreply@kimakyami.ao>',
        to: ['geral@kimakyami.ao'],
        replyTo: email,
        subject: `[Contacto] ${assunto}`,
        html: `
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Assunto:</strong> ${assunto}</p>
          <hr />
          <p>${mensagem.replace(/\n/g, '<br />')}</p>
        `,
      })
    } else {
      console.log('[contacto]', { nome, email, assunto, mensagem })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contacto]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
