import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { z } from 'zod'

const urlSegura = z.string().url().refine((v) => v.startsWith('https://'), 'URL tem de começar por https://')

const schema = z.object({
  email: z.string().email(),
  whatsapp: z.string().min(1),
  whatsappUrl: urlSegura,
  instagram: z.string().min(1),
  instagramUrl: urlSegura,
  localizacao: z.string().min(1),
  horario: z.string().min(1),
})

const DEFAULTS = {
  email: 'geral@kimakyami.ao',
  whatsapp: '+244 943771341',
  whatsappUrl: 'https://wa.me/244943771341',
  instagram: '@kimakyami',
  instagramUrl: 'https://instagram.com/kimakyami',
  localizacao: 'Luanda, Angola',
  horario: 'Segunda — Sexta: 09h00 – 18h00\nSábado: 10h00 – 14h00\nDomingo: Encerrado',
}

export async function GET() {
  try {
    const config = await db.configLoja.findUnique({ where: { id: 'singleton' } })
    return NextResponse.json(config ?? { id: 'singleton', ...DEFAULTS })
  } catch {
    return NextResponse.json({ id: 'singleton', ...DEFAULTS })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }
  const { email, whatsapp, whatsappUrl, instagram, instagramUrl, localizacao, horario } = parsed.data

  const config = await db.configLoja.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', email, whatsapp, whatsappUrl, instagram, instagramUrl, localizacao, horario },
    update: { email, whatsapp, whatsappUrl, instagram, instagramUrl, localizacao, horario },
  })

  return NextResponse.json(config)
}
