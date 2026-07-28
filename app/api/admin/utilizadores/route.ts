import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { RoleAdmin } from '@prisma/client'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { emailBemVindoAdmin } from '@/lib/email'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.nativeEnum(RoleAdmin),
})

const TOKEN_VALIDO_MS = 24 * 60 * 60 * 1000 // 24 horas — link de boas-vindas, dá mais margem que o de reposição

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== RoleAdmin.SUPER_ADMIN) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const { nome, email, role } = parsed.data

  const existente = await db.admin.findUnique({ where: { email }, select: { id: true } })
  if (existente) {
    return NextResponse.json({ error: 'Já existe um utilizador com esse email' }, { status: 409 })
  }

  // Password de acesso directo é aleatória e nunca é revelada — o novo utilizador
  // define a sua própria através do link de boas-vindas.
  const passwordAleatoria = crypto.randomBytes(24).toString('hex')
  const passwordHash = await bcrypt.hash(passwordAleatoria, 12)
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiraEm = new Date(Date.now() + TOKEN_VALIDO_MS)

  const admin = await db.admin.create({
    data: { nome, email, role, password: passwordHash, resetToken, resetTokenExpiraEm },
    select: { id: true, nome: true, email: true, role: true, criadoEm: true },
  })

  const base = process.env.NEXT_PUBLIC_URL ?? 'https://kimakyami.ao'
  const resetUrl = `${base}/admin/repor-password/${resetToken}`

  try {
    await emailBemVindoAdmin({ nome: admin.nome, email: admin.email }, resetUrl)
  } catch (err) {
    console.error('[utilizadores] Falha ao enviar email de boas-vindas', err)
  }

  return NextResponse.json({ admin })
}
