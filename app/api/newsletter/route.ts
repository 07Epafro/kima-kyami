import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { emailBoasVindasNewsletter } from '@/lib/email'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(ip, 3, 60_000)) {
    return NextResponse.json({ error: 'Demasiados pedidos. Tenta novamente em breve.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const { email } = parsed.data

  try {
    await emailBoasVindasNewsletter(email)
  } catch {
    /* Email failed — subscription registered */
  }

  return NextResponse.json({ ok: true })
}
