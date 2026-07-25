import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { z } from 'zod'

const updateSchema = z
  .object({
    banco: z.string().min(2),
    titular: z.string().min(2),
    iban: z.string().min(10),
    ativo: z.boolean(),
  })
  .partial()

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const conta = await db.contaBancaria.findUnique({ where: { id } })
  if (!conta) {
    return NextResponse.json({ error: 'Conta bancária não encontrada' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const atualizada = await db.contaBancaria.update({ where: { id }, data: parsed.data })
  return NextResponse.json(atualizada)
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const conta = await db.contaBancaria.findUnique({ where: { id } })
  if (!conta) {
    return NextResponse.json({ error: 'Conta bancária não encontrada' }, { status: 404 })
  }

  // Soft-delete: preserva o registo para que encomendas antigas continuem a
  // referenciar contaBancariaId sem apontar para um id inexistente.
  await db.contaBancaria.update({ where: { id }, data: { ativo: false } })

  return NextResponse.json({ ok: true })
}
