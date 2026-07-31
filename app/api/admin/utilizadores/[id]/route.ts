import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { RoleAdmin } from '@prisma/client'
import { auth } from '@/lib/auth'
import db from '@/lib/db'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório').optional(),
  email: z.string().email('Email inválido').optional(),
  role: z.nativeEnum(RoleAdmin).optional(),
  ativo: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role !== RoleAdmin.SUPER_ADMIN) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const alvo = await db.admin.findUnique({ where: { id } })
  if (!alvo) return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 })

  const { nome, email, role, ativo } = parsed.data

  if (email && email !== alvo.email) {
    const existente = await db.admin.findUnique({ where: { email }, select: { id: true } })
    if (existente) {
      return NextResponse.json({ error: 'Já existe um utilizador com esse email' }, { status: 409 })
    }
  }

  // Impede ficar sem nenhum SUPER_ADMIN activo — seja a despromover o próprio
  // cargo, seja a desactivar a conta.
  const vaiPerderSuperAdmin =
    alvo.role === RoleAdmin.SUPER_ADMIN &&
    alvo.ativo &&
    ((role !== undefined && role !== RoleAdmin.SUPER_ADMIN) || ativo === false)

  if (vaiPerderSuperAdmin) {
    const outrosSuperAdmins = await db.admin.count({
      where: { role: RoleAdmin.SUPER_ADMIN, ativo: true, id: { not: id } },
    })
    if (outrosSuperAdmins === 0) {
      return NextResponse.json(
        { error: 'Tem de existir pelo menos um Super Admin activo' },
        { status: 409 },
      )
    }
  }

  if (id === session.user.id && ativo === false) {
    return NextResponse.json({ error: 'Não podes desactivar a tua própria conta' }, { status: 409 })
  }

  const atualizado = await db.admin.update({
    where: { id },
    data: {
      ...(nome !== undefined && { nome }),
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
      ...(ativo !== undefined && { ativo }),
    },
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
  })

  return NextResponse.json({ admin: atualizado })
}
