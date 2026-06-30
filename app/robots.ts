import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_URL ?? 'https://kimakyami.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout/', '/carrinho'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
