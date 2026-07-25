import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ── db mock ───────────────────────────────────────────────────────────────────
const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    imagemSite: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  }
  return { mockDb }
})
vi.mock('@/lib/db', () => ({ default: mockDb }))

// ── auth mock ─────────────────────────────────────────────────────────────────
const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

// ── next/cache mock — revalidatePath só é válido num Route Handler real ───────
const { mockRevalidatePath } = vi.hoisted(() => ({ mockRevalidatePath: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }))

import { GET, PATCH, DELETE } from '@/app/api/imagens-site/route'
import { IMAGENS_SITE } from '@/lib/imagens-site'

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.imagemSite.findMany.mockResolvedValue([])
})

describe('GET /api/imagens-site', () => {
  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('devolve todas as chaves conhecidas com o valor por omissão quando a BD está vazia', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    const res = await GET()
    const body = (await res.json()) as { imagens: { chave: string; url: string; personalizada: boolean }[] }

    expect(res.status).toBe(200)
    expect(body.imagens).toHaveLength(IMAGENS_SITE.length)
    expect(body.imagens.every(i => !i.personalizada)).toBe(true)
    expect(body.imagens.find(i => i.chave === 'home-hero')?.url).toBe('/images/hero.jpeg')
  })

  it('sobrepõe o valor por omissão quando existe registo na BD', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    mockDb.imagemSite.findMany.mockResolvedValue([{ chave: 'home-hero', url: 'https://res.cloudinary.com/x/novo.jpg' }])

    const res = await GET()
    const body = (await res.json()) as { imagens: { chave: string; url: string; personalizada: boolean }[] }
    const hero = body.imagens.find(i => i.chave === 'home-hero')

    expect(hero?.url).toBe('https://res.cloudinary.com/x/novo.jpg')
    expect(hero?.personalizada).toBe(true)
  })
})

describe('PATCH /api/imagens-site', () => {
  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/imagens-site', {
      method: 'PATCH',
      body: JSON.stringify({ chave: 'home-hero', url: 'https://x/y.jpg' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('rejeita uma chave desconhecida com 400', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    const req = new NextRequest('http://localhost/api/imagens-site', {
      method: 'PATCH',
      body: JSON.stringify({ chave: 'nao-existe', url: 'https://x/y.jpg' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    expect(mockDb.imagemSite.upsert).not.toHaveBeenCalled()
  })

  it('actualiza a imagem, faz upsert e revalida as páginas afectadas', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    const req = new NextRequest('http://localhost/api/imagens-site', {
      method: 'PATCH',
      body: JSON.stringify({ chave: 'home-hero', url: 'https://res.cloudinary.com/x/novo.jpg' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    expect(mockDb.imagemSite.upsert).toHaveBeenCalledWith({
      where: { chave: 'home-hero' },
      create: { chave: 'home-hero', url: 'https://res.cloudinary.com/x/novo.jpg' },
      update: { url: 'https://res.cloudinary.com/x/novo.jpg' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/marca')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/lookbook')
  })

  it('não crasha o pedido se revalidatePath rebentar fora do contexto de Route Handler', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    mockRevalidatePath.mockImplementationOnce(() => { throw new Error('static generation store missing') })

    const req = new NextRequest('http://localhost/api/imagens-site', {
      method: 'PATCH',
      body: JSON.stringify({ chave: 'home-hero', url: 'https://x/y.jpg' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/imagens-site', () => {
  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/imagens-site?chave=home-hero', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('rejeita uma chave desconhecida com 400', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    const req = new NextRequest('http://localhost/api/imagens-site?chave=nao-existe', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('remove o override e repõe a imagem por omissão', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@kimakyami.com' } })
    const req = new NextRequest('http://localhost/api/imagens-site?chave=home-hero', { method: 'DELETE' })
    const res = await DELETE(req)

    expect(res.status).toBe(200)
    expect(mockDb.imagemSite.deleteMany).toHaveBeenCalledWith({ where: { chave: 'home-hero' } })
  })
})
