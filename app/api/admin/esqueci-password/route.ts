import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import db from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { emailResetPasswordAdmin } from '@/lib/email'

const schema = z.object({ email: z.string().email() })

const TOKEN_VALIDO_MS = 60 * 60 * 1000 // 1 hora

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(ip, 5, 60 * 60_000)) {
    return NextResponse.json({ error: 'Demasiados pedidos. Tenta novamente mais tarde.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  // Resposta genérica sempre igual, exista ou não o email — evita confirmar contas por enumeração.
  const respostaGenerica = NextResponse.json({
    ok: true,
    message: 'Se esse email existir, foi enviado um link de reposição de password.',
  })

  const admin = await db.admin.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, nome: true, email: true },
  })
  if (!admin) return respostaGenerica

  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiraEm = new Date(Date.now() + TOKEN_VALIDO_MS)

  try {
    await db.admin.update({
      where: { id: admin.id },
      data: { resetToken, resetTokenExpiraEm },
    })
  } catch (err) {
    console.error('[esqueci-password] Falha ao guardar token — a tabela pode ainda não ter as colunas (falta `npm run db:push`)', err)
    return NextResponse.json(
      { error: 'Funcionalidade ainda não disponível. Contacta o suporte técnico.' },
      { status: 503 },
    )
  }

  const base = process.env.NEXT_PUBLIC_URL ?? 'https://kimakyami.ao'
  const resetUrl = `${base}/admin/repor-password/${resetToken}`

  try {
    await emailResetPasswordAdmin({ nome: admin.nome, email: admin.email }, resetUrl)
  } catch (err) {
    console.error('[esqueci-password] Falha ao enviar email', err)
  }

  return respostaGenerica
}
