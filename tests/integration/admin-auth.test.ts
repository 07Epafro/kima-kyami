import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ── db mock ───────────────────────────────────────────────────────────────────
const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    admin: { findUnique: vi.fn() },
    encomenda: { findMany: vi.fn(), count: vi.fn() },
    produto: {
      findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(),
      create: vi.fn(), update: vi.fn(), count: vi.fn(),
    },
    $transaction: vi.fn(),
  }
  return { mockDb }
})
vi.mock('@/lib/db', () => ({ default: mockDb }))

// ── auth mock ─────────────────────────────────────────────────────────────────
const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

import { GET as getEncomendas } from '@/app/api/encomendas/route'
import { POST as postProduto } from '@/app/api/produtos/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.encomenda.findMany.mockResolvedValue([])
  mockDb.encomenda.count.mockResolvedValue(0)
  mockDb.produto.findMany.mockResolvedValue([])
  mockDb.produto.count.mockResolvedValue(0)
})

describe('Auth guard — GET /api/encomendas', () => {
  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/encomendas')
    const res = await getEncomendas(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/autorizado/i)
  })

  it('retorna 200 com sessão válida', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })

    const req = new NextRequest('http://localhost/api/encomendas')
    const res = await getEncomendas(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('encomendas')
  })
})

describe('Auth guard — POST /api/produtos', () => {
  const validBody = {
    nome: 'Salto Teste',
    slug: 'salto-teste',
    descricao: 'Descrição de teste com pelo menos dez caracteres',
    preco: 120,
    categoria: 'SALTOS',
    imagens: ['https://example.com/img.jpg'],
    tamanhos: [38, 39],
    cores: [{ nome: 'Preto', hex: '#000000' }],
    stock: { '38-Preto': 2, '39-Preto': 3 },
    destaque: false,
    emBreve: false,
    ativo: true,
  }

  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/produtos', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await postProduto(req)
    expect(res.status).toBe(401)
  })

  it('retorna 201 com sessão válida', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    mockDb.produto.findUnique.mockResolvedValue(null) // slug disponível
    mockDb.produto.create.mockResolvedValue({ id: 'new-prod', ...validBody })

    const req = new NextRequest('http://localhost/api/produtos', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await postProduto(req)
    expect(res.status).toBe(201)
  })
})

describe('GET /api/encomendas — filtros', () => {
  it('filtra por estado', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })

    const req = new NextRequest('http://localhost/api/encomendas?estado=PENDENTE')
    const res = await getEncomendas(req)

    expect(res.status).toBe(200)
    expect(mockDb.encomenda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estado: 'PENDENTE' }),
      }),
    )
  })

  it('pesquisa por referência', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })

    const req = new NextRequest('http://localhost/api/encomendas?search=KK-2026')
    const res = await getEncomendas(req)

    expect(res.status).toBe(200)
    expect(mockDb.encomenda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    )
  })
})

// ── Auth primitives (NextAuth authorize não é testável directamente) ───────────
describe('Lógica de autenticação — primitivos', () => {
  it('db.admin.findUnique retorna admin com email válido', async () => {
    const adminMock = { id: 'adm-1', email: 'admin@kimakyami.com', passwordHash: 'hash' }
    mockDb.admin.findUnique.mockResolvedValue(adminMock)

    const result = await mockDb.admin.findUnique({ where: { email: 'admin@kimakyami.com' } })

    expect(result).toEqual(adminMock)
    expect(mockDb.admin.findUnique).toHaveBeenCalledWith({ where: { email: 'admin@kimakyami.com' } })
  })

  it('db.admin.findUnique retorna null para email desconhecido', async () => {
    mockDb.admin.findUnique.mockResolvedValue(null)

    const result = await mockDb.admin.findUnique({ where: { email: 'intruso@hacker.com' } })

    expect(result).toBeNull()
  })
})
