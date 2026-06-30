import type { MetadataRoute } from 'next'
import db from '@/lib/db'

const BASE = process.env.NEXT_PUBLIC_URL ?? 'https://kimakyami.com'

const CATEGORIAS = ['SALTOS', 'SANDALIAS', 'MULES', 'COLECAO_LIMITADA'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const produtos = await db.produto.findMany({
    where: { ativo: true },
    select: { slug: true, atualizadoEm: true },
  })

  return [
    { url: `${BASE}/`, priority: 1, changeFrequency: 'weekly' },
    { url: `${BASE}/colecoes`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/lookbook`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE}/a-marca`, priority: 0.6, changeFrequency: 'monthly' },
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
  ]
}
