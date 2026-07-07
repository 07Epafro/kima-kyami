import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import db from '@/lib/db'
import ProductGallery from '@/components/store/ProductGallery'
import ProductInfo from '@/components/store/ProductInfo'
import type { CorProduto } from '@/types'

export const revalidate = 3600

const CATEGORIA_LABELS: Record<string, string> = {
  SALTOS: 'Saltos',
  SANDALIAS: 'Sandálias',
  MULES: 'Mules',
  COLECAO_LIMITADA: 'Coleção Limitada',
}

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    const produtos = await db.produto.findMany({ where: { ativo: true }, select: { slug: true } })
    return produtos.map(p => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const produto = await db.produto.findUnique({
    where: { slug },
    select: { nome: true, descricao: true, imagens: true, metaTitle: true, metaDesc: true, preco: true },
  })

  if (!produto) return { title: 'Produto não encontrado' }

  const title = produto.metaTitle ?? `${produto.nome} — Kima Kyami`
  const description = produto.metaDesc ?? produto.descricao.slice(0, 160)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: produto.imagens[0] ? [{ url: produto.imagens[0] }] : [],
      type: 'website',
    },
  }
}

export default async function ProdutoPage({ params }: Params) {
  const { slug } = await params

  const [produto, relacionados] = await Promise.all([
    db.produto.findUnique({ where: { slug } }),
    db.produto.findMany({
      where: { ativo: true, emBreve: false, NOT: { slug } },
      select: { id: true, nome: true, slug: true, preco: true, imagens: true },
      orderBy: { criadoEm: 'desc' },
      take: 3,
    }),
  ])
  if (!produto || !produto.ativo) notFound()

  const cores = produto.cores as unknown as CorProduto[]
  const stock = produto.stock as unknown as Record<string, number>

  const catLabel = CATEGORIA_LABELS[produto.categoria] ?? produto.categoria
  const BASE = process.env.NEXT_PUBLIC_URL ?? 'https://kimakyami.com'

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${BASE}/` },
      { '@type': 'ListItem', position: 2, name: 'Coleções', item: `${BASE}/colecoes` },
      { '@type': 'ListItem', position: 3, name: catLabel, item: `${BASE}/colecoes?categoria=${produto.categoria}` },
      { '@type': 'ListItem', position: 4, name: produto.nome, item: `${BASE}/produto/${produto.slug}` },
    ],
  }

  const produtoSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produto.nome,
    description: produto.descricao,
    image: produto.imagens,
    brand: { '@type': 'Brand', name: 'Kima Kyami' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'AOA',
      price: String(Math.round(produto.preco)),
      availability: produto.emBreve
        ? 'https://schema.org/PreOrder'
        : Object.values(stock).some(v => v > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${BASE}/produto/${produto.slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(produtoSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-16 py-10 lg:py-16">
        {/* Breadcrumb */}
        <nav
          className="flex items-center flex-wrap gap-2 text-[10px] tracking-[0.2em] text-muted mb-8 font-sans"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-gold transition-colors">INÍCIO</Link>
          <span>/</span>
          <Link href="/colecoes" className="hover:text-gold transition-colors">COLEÇÕES</Link>
          <span>/</span>
          <Link
            href={`/colecoes?categoria=${produto.categoria}`}
            className="hover:text-gold transition-colors uppercase"
          >
            {catLabel}
          </Link>
          <span>/</span>
          <span className="text-noir truncate max-w-[200px]">{produto.nome}</span>
        </nav>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Galeria */}
          <div className="lg:sticky lg:top-[92px] lg:self-start">
            <ProductGallery imagens={produto.imagens} nome={produto.nome} />
          </div>

          {/* Info */}
          <ProductInfo
            id={produto.id}
            nome={produto.nome}
            preco={produto.preco}
            precoAntes={produto.precoAntes}
            descricao={produto.descricao}
            tamanhos={produto.tamanhos}
            cores={cores}
            stock={stock}
            emBreve={produto.emBreve}
            slug={produto.slug}
            imagem={produto.imagens[0] ?? ''}
            imagens={produto.imagens}
            relacionados={relacionados}
          />
        </div>
      </div>
    </>
  )
}
