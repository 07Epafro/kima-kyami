import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ── cloudinary mock — captura as opções passadas a upload_stream ──────────────
const { mockUploadStream, mockConfig } = vi.hoisted(() => ({
  mockUploadStream: vi.fn(),
  mockConfig: vi.fn(),
}))
vi.mock('cloudinary', () => ({
  v2: {
    config: mockConfig,
    uploader: {
      upload_stream: (
        options: Record<string, unknown>,
        callback: (err: unknown, res: { secure_url: string; public_id: string; format: string } | null) => void,
      ) => {
        mockUploadStream(options)
        return {
          end: () => callback(null, { secure_url: 'https://res.cloudinary.com/x/site.jpg', public_id: 'x/site', format: 'jpg' }),
        }
      },
    },
  },
}))

// ── db mock (necessário para o branch de comprovante, não usado aqui) ─────────
const { mockDb } = vi.hoisted(() => ({ mockDb: { pagamento: { findUnique: vi.fn() } } }))
vi.mock('@/lib/db', () => ({ default: mockDb }))

// ── auth mock ─────────────────────────────────────────────────────────────────
const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

import { POST } from '@/app/api/upload/route'

const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

function buildRequest(fields: Record<string, string>, file = new File([JPEG_BYTES], 'foto.jpg', { type: 'image/jpeg' })) {
  const fd = new FormData()
  fd.append('file', file)
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  return new NextRequest('http://localhost/api/upload', { method: 'POST', body: fd })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/upload — tipo=site', () => {
  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildRequest({ tipo: 'site', chave: 'home-hero' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejeita uma chave desconhecida com 400', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    const req = buildRequest({ tipo: 'site', chave: 'nao-existe' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(mockUploadStream).not.toHaveBeenCalled()
  })

  it('rejeita quando falta a chave', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    const req = buildRequest({ tipo: 'site' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('recorta com a proporção da zona (gravity auto), largura da grelha e qualidade máxima', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    const req = buildRequest({ tipo: 'site', chave: 'home-categoria-saltos' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'kima-kyami/site',
        transformation: [{ width: 1600, aspect_ratio: '3:4', crop: 'fill', gravity: 'auto' }],
        quality: 'auto:best',
      }),
    )
  })

  it('usa a proporção 4:5 para a secção de citação', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    const req = buildRequest({ tipo: 'site', chave: 'home-quote' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        transformation: [{ width: 1800, aspect_ratio: '4:5', crop: 'fill', gravity: 'auto' }],
      }),
    )
  })

  it('usa maior resolução (2400px) para os heros de página inteira', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    const req = buildRequest({ tipo: 'site', chave: 'home-hero' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        transformation: [{ width: 2400, aspect_ratio: '3:2', crop: 'fill', gravity: 'auto' }],
      }),
    )
  })
})

describe('POST /api/upload — tipo=produto (comportamento existente preservado)', () => {
  it('continua a usar crop:limit sem aspect_ratio', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    const req = buildRequest({ tipo: 'produto' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'kima-kyami/produtos',
        transformation: [{ width: 1400, crop: 'limit' }],
      }),
    )
  })

  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)
    const req = buildRequest({ tipo: 'produto' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
