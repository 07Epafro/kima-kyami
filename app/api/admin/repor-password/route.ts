import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import db from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'A password deve ter pelo menos 6 caracteres'),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(ip, 10, 60 * 60_000)) {
    return NextResponse.json({ error: 'Demasiados pedidos. Tenta novamente mais tarde.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const { token, password } = parsed.data

  let admin: { id: string; resetTokenExpiraEm: Date | null } | null
  try {
    admin = await db.admin.findUnique({
      where: { resetToken: token },
      select: { id: true, resetTokenExpiraEm: true },
    })
  } catch (err) {
    console.error('[repor-password] Falha ao consultar token — falta `npm run db:push`?', err)
    return NextResponse.json({ error: 'Funcionalidade ainda não disponível.' }, { status: 503 })
  }

  if (!admin || !admin.resetTokenExpiraEm || admin.resetTokenExpiraEm < new Date()) {
    return NextResponse.json({ error: 'Link inválido ou expirado. Pede um novo.' }, { status: 400 })
  }

  const novaPasswordHash = await bcrypt.hash(password, 12)

  await db.admin.update({
    where: { id: admin.id },
    data: { password: novaPasswordHash, resetToken: null, resetTokenExpiraEm: null },
  })

  return NextResponse.json({ ok: true })
}
