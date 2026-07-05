import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import db from '@/lib/db'

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

  const body = await req.json()
  const { email, whatsapp, whatsappUrl, instagram, instagramUrl, localizacao, horario } = body

  const config = await db.configLoja.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', email, whatsapp, whatsappUrl, instagram, instagramUrl, localizacao, horario },
    update: { email, whatsapp, whatsappUrl, instagram, instagramUrl, localizacao, horario },
  })

  return NextResponse.json(config)
}
