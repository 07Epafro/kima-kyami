import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ── db mock ───────────────────────────────────────────────────────────────────
const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    produto: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  }
  return { mockDb }
})
vi.mock('@/lib/db', () => ({ default: mockDb }))

// ── auth mock ─────────────────────────────────────────────────────────────────
const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

import { GET, POST } from '@/app/api/produtos/route'
import { GET as getById, PUT, DELETE } from '@/app/api/produtos/[id]/route'

const PRODUTO_MOCK = {
  id: 'prod-abc12345',
  nome: 'Salto Dorado',
  slug: 'salto-dorado',
  descricao: 'Sapato de salto alto com acabamento dourado de luxo',
  preco: 120,
  precoAntes: null,
  categoria: 'SALTOS',
  imagens: ['https://example.com/img.jpg'],
  tamanhos: [37, 38, 39],
  cores: [{ nome: 'Dourado', hex: '#D4AF37' }],
  stock: { '38-Dourado': 3 },
  destaque: false,
  emBreve: false,
  ativo: true,
  criadoEm: new Date('2026-01-15'),
  atualizadoEm: new Date('2026-06-01'),
}

const VALID_POST_BODY = {
  nome: 'Mule Nude',
  slug: 'mule-nude',
  descricao: 'Mule de couro natural em tom nude elegante',
  preco: 95,
  categoria: 'MULES',
  imagens: ['https://example.com/mule.jpg'],
  tamanhos: [36, 37],
  cores: [{ nome: 'Nude', hex: '#F5DEB3' }],
  stock: { '36-Nude': 5 },
  destaque: false,
  emBreve: false,
  ativo: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
})

// ── GET /api/produtos (admin, paginado) ───────────────────────────────────────
describe('GET /api/produtos', () => {
  it('retorna lista paginada', async () => {
    mockDb.produto.findMany.mockResolvedValue([PRODUTO_MOCK])
    mockDb.produto.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/produtos?page=1&limit=20')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.produtos).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.paginas).toBe(1)
    expect(body.paginaActual).toBe(1)
  })

  it('filtra por categoria', async () => {
    mockDb.produto.findMany.mockResolvedValue([PRODUTO_MOCK])
    mockDb.produto.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/produtos?categoria=SALTOS')
    await GET(req)

    expect(mockDb.produto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoria: 'SALTOS' }),
      }),
    )
  })

  it('retorna lista pública com cursor', async () => {
    mockDb.produto.findMany.mockResolvedValue([PRODUTO_MOCK])

    const req = new NextRequest('http://localhost/api/produtos?public=1')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('itens')
    expect(body).toHaveProperty('nextCursor')
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=300')
  })
})

// ── GET /api/produtos/[id] ────────────────────────────────────────────────────
describe('GET /api/produtos/[id]', () => {
  it('retorna produto por id', async () => {
    mockDb.produto.findFirst.mockResolvedValue(PRODUTO_MOCK)

    const req = new NextRequest('http://localhost/api/produtos/prod-abc12345')
    const res = await getById(req, { params: Promise.resolve({ id: 'prod-abc12345' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('prod-abc12345')
  })

  it('retorna 404 quando produto não existe', async () => {
    mockDb.produto.findFirst.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/produtos/nope')
    const res = await getById(req, { params: Promise.resolve({ id: 'nope' }) })

    expect(res.status).toBe(404)
  })
})

// ── POST /api/produtos ────────────────────────────────────────────────────────
describe('POST /api/produtos', () => {
  it('cria produto autenticado → 201', async () => {
    mockDb.produto.findUnique.mockResolvedValue(null) // slug disponível
    mockDb.produto.create.mockResolvedValue({ id: 'new-prod', ...VALID_POST_BODY })

    const req = new NextRequest('http://localhost/api/produtos', {
      method: 'POST',
      body: JSON.stringify(VALID_POST_BODY),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.slug).toBe('mule-nude')
  })

  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/produtos', {
      method: 'POST',
      body: JSON.stringify(VALID_POST_BODY),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('gera slug único com sufixo quando slug já existe', async () => {
    mockDb.produto.findUnique
      .mockResolvedValueOnce(PRODUTO_MOCK) // 'salto-dorado' em uso
      .mockResolvedValueOnce(null)           // 'salto-dorado-1' disponível
    mockDb.produto.create.mockResolvedValue({ id: 'new-prod', ...VALID_POST_BODY, slug: 'salto-dorado-1' })

    const req = new NextRequest('http://localhost/api/produtos', {
      method: 'POST',
      body: JSON.stringify({ ...VALID_POST_BODY, slug: 'salto-dorado' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.slug).toBe('salto-dorado-1')
  })

  it('retorna 400 com payload inválido', async () => {
    const req = new NextRequest('http://localhost/api/produtos', {
      method: 'POST',
      body: JSON.stringify({ nome: 'x' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ── PUT /api/produtos/[id] ────────────────────────────────────────────────────
describe('PUT /api/produtos/[id]', () => {
  it('actualiza produto autenticado', async () => {
    mockDb.produto.findUnique.mockResolvedValue(PRODUTO_MOCK)
    mockDb.produto.findFirst.mockResolvedValue(null) // slug não em uso
    mockDb.produto.update.mockResolvedValue({ ...PRODUTO_MOCK, preco: 135 })

    const req = new NextRequest('http://localhost/api/produtos/prod-abc12345', {
      method: 'PUT',
      body: JSON.stringify({ preco: 135 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PUT(req, { params: Promise.resolve({ id: 'prod-abc12345' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.preco).toBe(135)
  })

  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/produtos/prod-abc12345', {
      method: 'PUT',
      body: JSON.stringify({ preco: 135 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PUT(req, { params: Promise.resolve({ id: 'prod-abc12345' }) })
    expect(res.status).toBe(401)
  })

  it('retorna 404 quando produto não existe', async () => {
    mockDb.produto.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/produtos/nope', {
      method: 'PUT',
      body: JSON.stringify({ preco: 135 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PUT(req, { params: Promise.resolve({ id: 'nope' }) })
    expect(res.status).toBe(404)
  })

  it('retorna 409 quando slug já existe noutro produto', async () => {
    mockDb.produto.findUnique.mockResolvedValue(PRODUTO_MOCK) // produto existe
    mockDb.produto.findFirst.mockResolvedValue({ id: 'outro-prod', slug: 'salto-dorado' }) // slug em uso

    const req = new NextRequest('http://localhost/api/produtos/prod-abc12345', {
      method: 'PUT',
      body: JSON.stringify({ slug: 'salto-dorado' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PUT(req, { params: Promise.resolve({ id: 'prod-abc12345' }) })
    expect(res.status).toBe(409)
  })

  it('retorna 400 com JSON inválido', async () => {
    mockDb.produto.findUnique.mockResolvedValue(PRODUTO_MOCK)

    const req = new NextRequest('http://localhost/api/produtos/prod-abc12345', {
      method: 'PUT',
      body: 'não é json',
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PUT(req, { params: Promise.resolve({ id: 'prod-abc12345' }) })
    expect(res.status).toBe(400)
  })
})

// ── DELETE /api/produtos/[id] (soft delete) ───────────────────────────────────
describe('DELETE /api/produtos/[id]', () => {
  it('faz soft delete (ativo=false)', async () => {
    mockDb.produto.findUnique.mockResolvedValue(PRODUTO_MOCK)
    mockDb.produto.update.mockResolvedValue({ ...PRODUTO_MOCK, ativo: false })

    const req = new NextRequest('http://localhost/api/produtos/prod-abc12345', {
      method: 'DELETE',
    })

    const res = await DELETE(req, { params: Promise.resolve({ id: 'prod-abc12345' }) })
    expect(res.status).toBe(200)

    expect(mockDb.produto.update).toHaveBeenCalledWith({
      where: { id: 'prod-abc12345' },
      data: { ativo: false },
    })
  })

  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/produtos/prod-abc12345', {
      method: 'DELETE',
    })

    const res = await DELETE(req, { params: Promise.resolve({ id: 'prod-abc12345' }) })
    expect(res.status).toBe(401)
  })

  it('retorna 404 quando produto não existe', async () => {
    mockDb.produto.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/produtos/nope', {
      method: 'DELETE',
    })

    const res = await DELETE(req, { params: Promise.resolve({ id: 'nope' }) })
    expect(res.status).toBe(404)
  })
})
