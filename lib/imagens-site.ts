import db from '@/lib/db'

export interface ImagemSiteDef {
  chave: string
  descricao: string
  grupo: 'Home' | 'A Marca' | 'Lookbook'
  urlDefault: string
  // Proporção (largura:altura) da zona onde a imagem é exibida no site — usada
  // para recortar de forma inteligente no Cloudinary ao carregar (crop:'fill',
  // gravity:'auto') e para a pré-visualização no admin corresponder ao real.
  aspectRatio: string
  // Largura-alvo do upload em pixels. Os heros ocupam o ecrã inteiro (podem
  // ser vistos em monitores grandes/retina) e precisam de mais resolução do
  // que uma célula de grelha, que nunca ocupa mais de ~metade do ecrã.
  uploadWidth: number
}

// Fonte única de verdade: cada slot de imagem personalizável do site,
// com o ficheiro estático usado como valor por omissão (nunca undefined
// para um `chave` conhecido, mesmo sem linha na BD ou sem BD disponível).
export const IMAGENS_SITE: ImagemSiteDef[] = [
  { chave: 'home-hero', descricao: 'Hero principal', grupo: 'Home', urlDefault: '/images/hero.jpeg', aspectRatio: '3:2', uploadWidth: 2400 },
  { chave: 'home-categoria-saltos', descricao: 'Categoria — Saltos', grupo: 'Home', urlDefault: '/images/categoria-saltos.jpeg', aspectRatio: '3:4', uploadWidth: 1600 },
  { chave: 'home-categoria-sandalias', descricao: 'Categoria — Sandálias', grupo: 'Home', urlDefault: '/images/categoria-sandalias.jpeg', aspectRatio: '3:4', uploadWidth: 1600 },
  { chave: 'home-categoria-mules', descricao: 'Categoria — Mules', grupo: 'Home', urlDefault: '/images/categoria-mules.jpeg', aspectRatio: '3:4', uploadWidth: 1600 },
  { chave: 'home-categoria-colecao-limitada', descricao: 'Categoria — Coleção Limitada', grupo: 'Home', urlDefault: '/images/categoria-colecao-limitada.jpeg', aspectRatio: '3:4', uploadWidth: 1600 },
  { chave: 'home-quote', descricao: 'Secção de citação', grupo: 'Home', urlDefault: '/images/quote-section.jpeg', aspectRatio: '4:5', uploadWidth: 1800 },
  { chave: 'home-exclusividade-1', descricao: 'Exclusividade — imagem esquerda', grupo: 'Home', urlDefault: '/images/exclusividade-1.jpeg', aspectRatio: '4:5', uploadWidth: 1600 },
  { chave: 'home-exclusividade-2', descricao: 'Exclusividade — imagem direita', grupo: 'Home', urlDefault: '/images/exclusividade-2.jpeg', aspectRatio: '4:5', uploadWidth: 1600 },
  { chave: 'marca-hero', descricao: 'Hero da página A Marca', grupo: 'A Marca', urlDefault: '/images/marca-hero.jpeg', aspectRatio: '3:2', uploadWidth: 2400 },
  { chave: 'marca-editorial', descricao: 'Imagem editorial (Artesanato)', grupo: 'A Marca', urlDefault: '/images/marca-editorial.jpeg', aspectRatio: '4:3', uploadWidth: 1800 },
  { chave: 'lookbook-verao-2025', descricao: 'Verão 2025', grupo: 'Lookbook', urlDefault: '/images/lookbook-verao-2025.jpeg', aspectRatio: '4:5', uploadWidth: 2000 },
  { chave: 'lookbook-colecao-noite', descricao: 'Coleção Noite', grupo: 'Lookbook', urlDefault: '/images/lookbook-colecao-noite.jpeg', aspectRatio: '4:5', uploadWidth: 1600 },
  { chave: 'lookbook-saltos-signature', descricao: 'Saltos Signature', grupo: 'Lookbook', urlDefault: '/images/lookbook-saltos-signature.jpeg', aspectRatio: '4:5', uploadWidth: 1600 },
  { chave: 'lookbook-mules', descricao: 'Mules Exclusivos', grupo: 'Lookbook', urlDefault: '/images/lookbook-mules.jpeg', aspectRatio: '4:5', uploadWidth: 1600 },
  { chave: 'lookbook-sandalias', descricao: 'Sandálias', grupo: 'Lookbook', urlDefault: '/images/lookbook-sandalias.jpeg', aspectRatio: '4:5', uploadWidth: 1600 },
]

export function getImagemSiteDef(chave: string): ImagemSiteDef | undefined {
  return IMAGENS_SITE.find(i => i.chave === chave)
}

export const IMAGENS_SITE_CHAVES = new Set(IMAGENS_SITE.map(i => i.chave))

export async function getImagensSite(): Promise<Record<string, string>> {
  const map: Record<string, string> = Object.fromEntries(IMAGENS_SITE.map(i => [i.chave, i.urlDefault]))
  try {
    const rows = await db.imagemSite.findMany({ select: { chave: true, url: true } })
    for (const row of rows) {
      if (IMAGENS_SITE_CHAVES.has(row.chave)) map[row.chave] = row.url
    }
  } catch {
    // BD indisponível (ex. build sem ligação) — mantém os valores por omissão
  }
  return map
}
