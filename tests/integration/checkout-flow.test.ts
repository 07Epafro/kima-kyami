import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockDb, mockTx } = vi.hoisted(() => {
  const mockTx = {
    cliente: { upsert: vi.fn() },
    encomenda: { create: vi.fn(), update: vi.fn() },
    pagamento: { create: vi.fn() },
    produto: { findUnique: vi.fn(), update: vi.fn() },
  }
  const mockDb = {
    produto: { findMany: vi.fn() },
    $transaction: vi.fn(),
  }
  return { mockDb, mockTx }
})

vi.mock('@/lib/db', () => ({ default: mockDb }))
vi.mock('@/lib/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

const { mockEmailConfirmacao } = vi.hoisted(() => ({
  mockEmailConfirmacao: vi.fn(),
}))
vi.mock('@/lib/email', () => ({
  emailConfirmacaoEncomenda: mockEmailConfirmacao,
  emailEncomendaConfirmada: vi.fn(),
  emailEncomendaCancelada: vi.fn(),
}))

import { POST } from '@/app/api/encomendas/route'

const PRODUTO_MOCK = {
  id: 'prod-abc12345',
  nome: 'Salto Dorado',
  preco: 89.99,
  stock: { '38-Dourado': 3 },
  emBreve: false,
}

const CLIENTE_MOCK = { id: 'cli-1', email: 'cliente@test.com', nome: 'Ana Silva' }
const ENC_MOCK = { id: 'enc-abc12345', referencia: 'TEMP' }
const PAG_MOCK = { id: 'pag-xyz', valor: 89.99 }

function buildRequest(body: unknown) {
  return new NextRequest('http://localhost/api/encomendas', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const PAYLOAD = {
  nome: 'Ana Silva',
  email: 'cliente@test.com',
  moradaRua: 'Rua Castilho 42',
  moradaCidade: 'Lisboa',
  moradaCp: '1250-071',
  itens: [{ produtoId: 'prod-abc12345', tamanho: 38, cor: 'Dourado', quantidade: 1 }],
}

beforeEach(() => {
  vi.clearAllMocks()

  mockDb.produto.findMany.mockResolvedValue([PRODUTO_MOCK])

  mockDb.$transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) =>
    fn(mockTx)
  )

  mockTx.cliente.upsert.mockResolvedValue(CLIENTE_MOCK)
  mockTx.encomenda.create.mockResolvedValue(ENC_MOCK)
  mockTx.encomenda.update.mockResolvedValue({ ...ENC_MOCK, referencia: 'KK-2026-2345' })
  mockTx.pagamento.create.mockResolvedValue(PAG_MOCK)
  mockTx.produto.findUnique.mockResolvedValue({ stock: { '38-Dourado': 3 } })
  mockTx.produto.update.mockResolvedValue({})

  mockEmailConfirmacao.mockResolvedValue(undefined)
})

describe('POST /api/encomendas', () => {
  it('cria encomenda e retorna 201 com referência', async () => {
    const res = await POST(buildRequest(PAYLOAD))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.encomendaId).toBe('enc-abc12345')
    expect(body.pagamentoId).toBe('pag-xyz')
    expect(body.referencia).toMatch(/^KK-\d{4}-[A-Z0-9]{4}$/)
    expect(body.valor).toBe(89.99 + 5.99) // subtotal < 150, portes = 5.99
  })

  it('decrementa stock do produto no tamanho e cor correctos', async () => {
    await POST(buildRequest(PAYLOAD))

    expect(mockTx.produto.update).toHaveBeenCalledWith({
      where: { id: 'prod-abc12345' },
      data: { stock: { '38-Dourado': 2 } },
    })
  })

  it('envia email de confirmação', async () => {
    await POST(buildRequest(PAYLOAD))
    expect(mockEmailConfirmacao).toHaveBeenCalledOnce()
  })

  it('retorna 400 quando payload é inválido', async () => {
    const res = await POST(buildRequest({ nome: 'x', email: 'invalido' }))
    expect(res.status).toBe(400)
  })

  it('retorna 422 quando produto não existe', async () => {
    mockDb.produto.findMany.mockResolvedValue([])
    const res = await POST(buildRequest(PAYLOAD))
    expect(res.status).toBe(422)
  })

  it('retorna 422 quando stock insuficiente', async () => {
    mockDb.produto.findMany.mockResolvedValue([{ ...PRODUTO_MOCK, stock: { '38-Dourado': 0 } }])
    const res = await POST(buildRequest(PAYLOAD))
    expect(res.status).toBe(422)
  })

  it('aplica portes grátis quando subtotal >= 150', async () => {
    const produtoCaro = { ...PRODUTO_MOCK, preco: 180 }
    mockDb.produto.findMany.mockResolvedValue([produtoCaro])
    mockTx.produto.findUnique.mockResolvedValue({ stock: { '38-Dourado': 3 } })

    const res = await POST(buildRequest(PAYLOAD))
    const body = await res.json()

    expect(body.valor).toBe(180) // portes = 0
  })
})
