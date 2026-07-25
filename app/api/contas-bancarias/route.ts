import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { z } from 'zod'

const contaSchema = z.object({
  banco: z.string().min(2, 'Banco obrigatório'),
  titular: z.string().min(2, 'Titular obrigatório'),
  iban: z.string().min(10, 'IBAN obrigatório'),
  ativo: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // ── Public / checkout mode — apenas contas activas, campos mínimos ──────────
  if (searchParams.get('public') === '1') {
    const contas = await db.contaBancaria.findMany({
      where: { ativo: true },
      orderBy: { criadoEm: 'asc' },
      select: { id: true, banco: true, titular: true },
    })
    // Sem cache: uma conta desactivada pelo admin não deve continuar a ser
    // oferecida no checkout a partir de uma resposta em cache.
    return NextResponse.json({ contas })
  }

  // ── Admin mode — lista completa ─────────────────────────────────────────────
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const contas = await db.contaBancaria.findMany({ orderBy: { criadoEm: 'asc' } })
  return NextResponse.json({ contas })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = contaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const conta = await db.contaBancaria.create({ data: parsed.data })
  return NextResponse.json(conta, { status: 201 })
}

export const revalidate = 0
