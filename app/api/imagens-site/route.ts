import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { z } from 'zod'
import { IMAGENS_SITE, IMAGENS_SITE_CHAVES } from '@/lib/imagens-site'

const patchSchema = z.object({
  chave: z.string().refine(v => IMAGENS_SITE_CHAVES.has(v), { message: 'Chave de imagem desconhecida' }),
  url: z.string().min(1, 'URL obrigatório'),
})

function revalidarPaginasAfectadas() {
  // revalidatePath só é válido dentro do contexto de um Route Handler em execução
  // real (next dev/start) — protege testes e qualquer chamada fora desse contexto.
  try {
    revalidatePath('/')
    revalidatePath('/marca')
    revalidatePath('/lookbook')
  } catch (err) {
    console.error('[imagens-site] revalidatePath falhou — imagem actualizada, cache expira no próximo ciclo natural', err)
  }
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let overrides = new Map<string, string>()
  try {
    const rows = await db.imagemSite.findMany({ select: { chave: true, url: true } })
    overrides = new Map(rows.map(r => [r.chave, r.url]))
  } catch (err) {
    // Tabela ainda não existe (antes de `npx prisma db push`) — mostra os valores
    // por omissão em vez de rebentar; o admin vê a lista, só não tem overrides.
    console.error('[imagens-site] Falha ao consultar overrides — a mostrar valores por omissão', err)
  }

  const imagens = IMAGENS_SITE.map(def => ({
    chave: def.chave,
    descricao: def.descricao,
    grupo: def.grupo,
    url: overrides.get(def.chave) ?? def.urlDefault,
    personalizada: overrides.has(def.chave),
  }))

  return NextResponse.json({ imagens })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { chave, url } = parsed.data
  try {
    await db.imagemSite.upsert({
      where: { chave },
      create: { chave, url },
      update: { url },
    })
  } catch (err) {
    console.error('[imagens-site] Falha ao guardar — tabela pode não existir ainda (falta `prisma db push`)', err)
    return NextResponse.json(
      { error: 'Não foi possível guardar. A base de dados pode ainda não estar actualizada — contacta o suporte.' },
      { status: 503 },
    )
  }

  revalidarPaginasAfectadas()

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const chave = searchParams.get('chave')
  if (!chave || !IMAGENS_SITE_CHAVES.has(chave)) {
    return NextResponse.json({ error: 'Chave de imagem desconhecida' }, { status: 400 })
  }

  // Repõe a imagem por omissão — remove apenas o override, se existir.
  try {
    await db.imagemSite.deleteMany({ where: { chave } })
  } catch (err) {
    console.error('[imagens-site] Falha ao repor — tabela pode não existir ainda (falta `prisma db push`)', err)
    return NextResponse.json(
      { error: 'Não foi possível repor a imagem. A base de dados pode ainda não estar actualizada.' },
      { status: 503 },
    )
  }

  revalidarPaginasAfectadas()

  return NextResponse.json({ ok: true })
}

export const revalidate = 0
