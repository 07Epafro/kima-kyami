import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { Categoria } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CATEGORIAS = ['SALTOS', 'SANDALIAS', 'MULES', 'COLECAO_LIMITADA'] as const

const schema = z
  .object({
    nome: z.string().min(2),
    slug: z.string().min(2),
    descricao: z.string().min(10),
    preco: z.number().positive(),
    precoAntes: z.number().positive().optional(),
    categoria: z.enum(CATEGORIAS),
    colecao: z.string().optional(),
    imagens: z.array(z.string().url()).min(1),
    tamanhos: z.array(z.number().int().min(35).max(45)).min(1),
    cores: z.array(z.object({ nome: z.string(), hex: z.string() })).min(1),
    stock: z.record(z.number().int().min(0)),
    destaque: z.boolean(),
    emBreve: z.boolean(),
    ativo: z.boolean(),
    metaTitle: z.string().optional(),
    metaDesc: z.string().optional(),
  })
  .partial()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params

  // Accept both cuid (admin) and slug (store)
  const produto = await db.produto.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  })
  if (!produto) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  return NextResponse.json(produto)
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  const produto = await db.produto.findUnique({ where: { id } })
  if (!produto) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Verificar unicidade do slug (excluindo o produto actual)
  if (data.slug) {
    const slugExistente = await db.produto.findFirst({
      where: { slug: data.slug, NOT: { id } },
    })
    if (slugExistente) {
      return NextResponse.json({ error: 'Slug já em uso. Escolha outro.' }, { status: 409 })
    }
  }

  const atualizado = await db.produto.update({
    where: { id },
    data: {
      ...(data.nome !== undefined && { nome: data.nome }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.descricao !== undefined && { descricao: data.descricao }),
      ...(data.preco !== undefined && { preco: data.preco }),
      ...(data.precoAntes !== undefined && { precoAntes: data.precoAntes }),
      ...(data.categoria !== undefined && { categoria: data.categoria as Categoria }),
      ...(data.colecao !== undefined && { colecao: data.colecao }),
      ...(data.imagens !== undefined && { imagens: data.imagens }),
      ...(data.tamanhos !== undefined && { tamanhos: data.tamanhos }),
      ...(data.cores !== undefined && { cores: data.cores }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.destaque !== undefined && { destaque: data.destaque }),
      ...(data.emBreve !== undefined && { emBreve: data.emBreve }),
      ...(data.ativo !== undefined && { ativo: data.ativo }),
      ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
      ...(data.metaDesc !== undefined && { metaDesc: data.metaDesc }),
    },
  })

  return NextResponse.json(atualizado)
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  const produto = await db.produto.findUnique({ where: { id } })
  if (!produto) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  await db.produto.update({ where: { id }, data: { ativo: false } })

  return NextResponse.json({ ok: true })
}
