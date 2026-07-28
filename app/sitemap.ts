import type { MetadataRoute } from 'next'
import db from '@/lib/db'

const BASE = process.env.NEXT_PUBLIC_URL ?? 'https://kimakyami.ao'

const CATEGORIAS = ['SALTOS', 'SANDALIAS', 'MULES', 'COLECAO_LIMITADA'] as const

const PAGINAS_INFORMATIVAS = ['/faq', '/envios', '/trocas-e-devolucoes', '/termos', '/privacidade']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let produtos: { slug: string; atualizadoEm: Date }[] = []
  try {
    produtos = await db.produto.findMany({ where: { ativo: true }, select: { slug: true, atualizadoEm: true } })
  } catch { /* DB unavailable at build time — sitemap omits dynamic URLs */ }

  return [
    { url: `${BASE}/`, priority: 1, changeFrequency: 'weekly' },
    { url: `${BASE}/colecoes`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/lookbook`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE}/marca`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${BASE}/contactos`, priority: 0.5, changeFrequency: 'monthly' },
    ...CATEGORIAS.map(cat => ({
      url: `${BASE}/colecoes?categoria=${cat}`,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    })),
    ...produtos.map(p => ({
      url: `${BASE}/produto/${p.slug}`,
      lastModified: p.atualizadoEm,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...PAGINAS_INFORMATIVAS.map(caminho => ({
      url: `${BASE}${caminho}`,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ]
}
