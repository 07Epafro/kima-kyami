import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { server } from '../mocks/server'
import { COMPROVANTE_OK_URL } from '../mocks/handlers'

// ── db mock ───────────────────────────────────────────────────────────────────
const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    pagamento: { findUnique: vi.fn(), update: vi.fn() },
    encomenda: { update: vi.fn() },
    $transaction: vi.fn(),
  }
  return { mockDb }
})
vi.mock('@/lib/db', () => ({ default: mockDb }))

// ── auth mock ─────────────────────────────────────────────────────────────────
const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

// ── validarComprovante mock ───────────────────────────────────────────────────
const { mockValidar } = vi.hoisted(() => ({ mockValidar: vi.fn() }))
vi.mock('@/lib/validar-comprovante', () => ({ validarComprovante: mockValidar }))

// ── Resend mock ───────────────────────────────────────────────────────────────
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'email-ok' }) },
  })),
}))

// ── email helpers mock ────────────────────────────────────────────────────────
vi.mock('@/lib/email', () => ({
  emailEncomendaConfirmada: vi.fn().mockResolvedValue(undefined),
  emailEncomendaCancelada: vi.fn().mockResolvedValue(undefined),
  emailConfirmacaoEncomenda: vi.fn().mockResolvedValue(undefined),
}))

import { POST as validarPOST } from '@/app/api/pagamentos/validar/[id]/route'
import { PUT, PATCH } from '@/app/api/pagamentos/[id]/route'

// ── MSW ───────────────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const ENCOMENDA_MOCK = {
  id: 'enc-1',
  referencia: 'KK-2026-1234',
  criadaEm: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  total: 89.99,
  subtotal: 84,
  portes: 5.99,
  moradaEnvio: { rua: 'Rua A', codigoPostal: '1000-001', cidade: 'Lisboa', pais: 'Portugal' },
  itens: [],
  cliente: { nome: 'Ana', email: 'ana@test.com' },
}

const PAG_MOCK = {
  id: 'pag-1',
  valor: 89.99,
  estado: 'COMPROVANTE_SUBMETIDO',
  encomenda: ENCOMENDA_MOCK,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } })
  mockDb.pagamento.findUnique.mockResolvedValue(PAG_MOCK)
  mockDb.pagamento.update.mockResolvedValue({ ...PAG_MOCK, estado: 'VALIDADO_AUTO_OK' })
  mockDb.encomenda.update.mockResolvedValue({ ...ENCOMENDA_MOCK, estado: 'CONFIRMADA' })
  mockDb.$transaction.mockImplementation(async (arr: Promise<unknown>[]) => Promise.all(arr))
})

// ── PUT /api/pagamentos/[id] (submeter comprovante) ───────────────────────────
describe('PUT /api/pagamentos/[id]', () => {
  const params = Promise.resolve({ id: 'pag-1' })

  it('actualiza comprovante para COMPROVANTE_SUBMETIDO', async () => {
    mockDb.pagamento.findUnique.mockResolvedValue({ id: 'pag-1' })
    mockDb.pagamento.update.mockResolvedValue({ id: 'pag-1', estado: 'COMPROVANTE_SUBMETIDO' })

    const req = new NextRequest('http://localhost/api/pagamentos/pag-1', {
      method: 'PUT',
      body: JSON.stringify({ comprovante: COMPROVANTE_OK_URL }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PUT(req, { params })
    expect(res.status).toBe(200)
    expect(mockDb.pagamento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pag-1' },
        data: expect.objectContaining({ comprovante: COMPROVANTE_OK_URL }),
      }),
    )
  })

  it('retorna 404 se pagamento não existe', async () => {
    mockDb.pagamento.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/pagamentos/nope', {
      method: 'PUT',
      body: JSON.stringify({ comprovante: COMPROVANTE_OK_URL }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PUT(req, { params: Promise.resolve({ id: 'nope' }) })
    expect(res.status).toBe(404)
  })
})

// ── POST /api/pagamentos/validar/[id] ─────────────────────────────────────────
describe('POST /api/pagamentos/validar/[id]', () => {
  const params = Promise.resolve({ id: 'pag-1' })

  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/pagamentos/validar/pag-1', {
      method: 'POST',
      body: JSON.stringify({ comprovanteUrl: COMPROVANTE_OK_URL }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await validarPOST(req, { params })
    expect(res.status).toBe(401)
  })

  it('valida comprovante OK e actualiza pagamento', async () => {
    mockValidar.mockResolvedValue({
      estado: 'OK',
      aprovado: true,
      score: 95,
      alertas: [],
      detalhes: {},
    })

    const req = new NextRequest('http://localhost/api/pagamentos/validar/pag-1', {
      method: 'POST',
      body: JSON.stringify({ comprovanteUrl: COMPROVANTE_OK_URL }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await validarPOST(req, { params })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.resultado.estado).toBe('OK')
    expect(mockDb.pagamento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: 'VALIDADO_AUTO_OK' }),
      }),
    )
  })

  it('valida comprovante REJEITADO', async () => {
    mockValidar.mockResolvedValue({
      estado: 'REJEITADO',
      aprovado: false,
      score: 10,
      alertas: ['Valor não encontrado no documento'],
      detalhes: {},
    })
    mockDb.pagamento.update.mockResolvedValue({ ...PAG_MOCK, estado: 'VALIDADO_AUTO_REJEITADO' })

    const req = new NextRequest('http://localhost/api/pagamentos/validar/pag-1', {
      method: 'POST',
      body: JSON.stringify({ comprovanteUrl: COMPROVANTE_OK_URL }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await validarPOST(req, { params })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.resultado.estado).toBe('REJEITADO')
    expect(mockDb.pagamento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: 'VALIDADO_AUTO_REJEITADO' }),
      }),
    )
  })
})

// ── PATCH /api/pagamentos/[id] (aprovação admin) ──────────────────────────────
describe('PATCH /api/pagamentos/[id]', () => {
  const params = Promise.resolve({ id: 'pag-1' })

  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/pagamentos/pag-1', {
      method: 'PATCH',
      body: JSON.stringify({ validacaoAdmin: true }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PATCH(req, { params })
    expect(res.status).toBe(401)
  })

  it('confirma pagamento → encomenda CONFIRMADA + email enviado', async () => {
    const { emailEncomendaConfirmada } = await import('@/lib/email')
    mockDb.pagamento.update.mockResolvedValue({ id: 'pag-1', estado: 'CONFIRMADO_ADMIN' })

    const req = new NextRequest('http://localhost/api/pagamentos/pag-1', {
      method: 'PATCH',
      body: JSON.stringify({ validacaoAdmin: true }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PATCH(req, { params })
    expect(res.status).toBe(200)

    expect(mockDb.$transaction).toHaveBeenCalledOnce()
    expect(emailEncomendaConfirmada).toHaveBeenCalledOnce()
  })

  it('rejeita pagamento com nota', async () => {
    const { emailEncomendaCancelada } = await import('@/lib/email')
    mockDb.pagamento.update.mockResolvedValue({ id: 'pag-1', estado: 'REJEITADO_ADMIN' })

    const req = new NextRequest('http://localhost/api/pagamentos/pag-1', {
      method: 'PATCH',
      body: JSON.stringify({ validacaoAdmin: false, notaAdmin: 'Comprovante ilegível' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PATCH(req, { params })
    expect(res.status).toBe(200)
    expect(emailEncomendaCancelada).toHaveBeenCalledOnce()
  })

  it('retorna 422 ao rejeitar sem nota', async () => {
    const req = new NextRequest('http://localhost/api/pagamentos/pag-1', {
      method: 'PATCH',
      body: JSON.stringify({ validacaoAdmin: false }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PATCH(req, { params })
    expect(res.status).toBe(422)
  })
})
