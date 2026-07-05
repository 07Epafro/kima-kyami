import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const { email } = parsed.data

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Kima Kyami <noreply@kimakyami.com>',
      to: email,
      subject: 'Bem-vinda à Kima Kyami',
      html: `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:560px">
        <tr>
          <td style="background:#181818;padding:32px 40px;text-align:center">
            <p style="margin:0;font-size:32px;letter-spacing:14px;color:#f7c480;font-weight:300">KK</p>
          </td>
        </tr>
        <tr>
          <td style="padding:48px 40px">
            <p style="margin:0 0 20px;font-size:13px;color:#181818;line-height:1.9;font-family:Arial,sans-serif">
              Bem-vinda à Kima Kyami.
            </p>
            <p style="margin:0 0 20px;font-size:13px;color:#181818;line-height:1.9;font-family:Arial,sans-serif">
              Serás das primeiras a saber dos nossos novos lançamentos, coleções exclusivas e ofertas especiais.
            </p>
            <p style="margin:0;font-size:13px;color:#181818;line-height:1.9;font-family:Arial,sans-serif">
              Obrigada por fazeres parte desta jornada.
            </p>
            <hr style="border:none;border-top:1px solid #e8e0d8;margin:36px 0">
            <p style="margin:0;font-size:11px;color:#9a9a9a;font-family:Arial,sans-serif;text-align:center">
              Kima Kyami · <a href="mailto:hello@kimakyami.com" style="color:#9a9a9a">hello@kimakyami.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    })
  } catch {
    /* Email failed — subscription still registered conceptually */
  }

  return NextResponse.json({ ok: true })
}
