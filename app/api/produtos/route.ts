import { auth } from '@/lib/auth'
import db from '@/lib/db'
import { Categoria, Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CATEGORIAS = ['SALTOS', 'SANDALIAS', 'MULES', 'COLECAO_LIMITADA'] as const

const schema = z.object({
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
  destaque: z.boolean().default(false),
  emBreve: z.boolean().default(false),
  ativo: z.boolean().default(true),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
})

type SortField = 'nome' | 'preco' | 'stock' | 'criadoEm'
type SortOrder = 'asc' | 'desc'

function buildWhere(params: {
  categoria?: string
  estado?: string
  search?: string
}): Prisma.ProdutoWhereInput {
  const where: Prisma.ProdutoWhereInput = {}

  if (params.categoria && CATEGORIAS.includes(params.categoria as (typeof CATEGORIAS)[number])) {
    where.categoria = params.categoria as Categoria
  }

  if (params.estado === 'ativo') {
    where.ativo = true
    where.emBreve = false
  } else if (params.estado === 'emBreve') {
    where.emBreve = true
  } else if (params.estado === 'inativo') {
    where.ativo = false
  }

  if (params.search) {
    where.nome = { contains: params.search, mode: 'insensitive' }
  }

  return where
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // ── Public / store cursor-based mode ──────────────────────────
  if (searchParams.get('public') === '1' || searchParams.has('cursor')) {
    const categoria = searchParams.get('categoria') as Categoria | null
    const ordem = searchParams.get('ordem') ?? 'novidades'
    const cursor = searchParams.get('cursor')
    const limite = Math.min(Math.max(1, parseInt(searchParams.get('limite') ?? '12')), 48)

    const where: Prisma.ProdutoWhereInput = {
      ativo: true,
      emBreve: false,
      ...(categoria && (CATEGORIAS as readonly string[]).includes(categoria)
        ? { categoria }
        : {}),
    }

    const orderBy: Prisma.ProdutoOrderByWithRelationInput =
      ordem === 'preco_asc' ? { preco: 'asc' }
      : ordem === 'preco_desc' ? { preco: 'desc' }
      : { criadoEm: 'desc' }

    const rows = await db.produto.findMany({
      where,
      orderBy,
      take: limite + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true, nome: true, slug: true, preco: true, precoAntes: true,
        categoria: true, imagens: true, emBreve: true, tamanhos: true, stock: true,
      },
    })

    const temMais = rows.length > limite
    const itens = temMais ? rows.slice(0, limite) : rows
    const nextCursor = temMais ? itens[itens.length - 1].id : null

    return NextResponse.json({ itens, nextCursor }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    })
  }

  // ── Admin page-based mode ──────────────────────────────────────
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10) || 20))
  const skip = (page - 1) * limit

  const sortParam = (searchParams.get('sort') ?? 'criadoEm') as SortField
  const order: SortOrder = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

  const validSorts: SortField[] = ['nome', 'preco', 'stock', 'criadoEm']
  const sortField: SortField = validSorts.includes(sortParam) ? sortParam : 'criadoEm'

  // JSON fields (stock) cannot be sorted — fallback to criadoEm
  const orderBy: Prisma.ProdutoOrderByWithRelationInput =
    sortField === 'stock'
      ? { criadoEm: order }
      : { [sortField]: order }

  const where = buildWhere({
    categoria: searchParams.get('categoria') ?? undefined,
    estado: searchParams.get('estado') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  })

  const [produtos, total] = await Promise.all([
    db.produto.findMany({ where, skip, take: limit, orderBy }),
    db.produto.count({ where }),
  ])

  const paginas = Math.ceil(total / limit)

  return NextResponse.json({ produtos, total, paginas, paginaActual: page })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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

  const slugExistente = await db.produto.findUnique({ where: { slug: data.slug } })
  if (slugExistente) {
    return NextResponse.json({ error: 'Slug já em uso. Escolha outro.' }, { status: 409 })
  }

  const produto = await db.produto.create({
    data: {
      nome: data.nome,
      slug: data.slug,
      descricao: data.descricao,
      preco: data.preco,
      precoAntes: data.precoAntes ?? null,
      categoria: data.categoria,
      colecao: data.colecao ?? null,
      imagens: data.imagens,
      tamanhos: data.tamanhos,
      cores: data.cores,
      stock: data.stock,
      destaque: data.destaque,
      emBreve: data.emBreve,
      ativo: data.ativo,
      metaTitle: data.metaTitle ?? null,
      metaDesc: data.metaDesc ?? null,
    },
  })

  return NextResponse.json(produto, { status: 201 })
}
