'use client'

import { usePathname } from 'next/navigation'

const titulos: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/produtos': 'Produtos',
  '/admin/produtos/novo': 'Novo Produto',
  '/admin/encomendas': 'Encomendas',
  '/admin/clientes': 'Clientes',
  '/admin/pagamentos': 'Pagamentos',
}

function derivarTitulo(pathname: string): string {
  if (titulos[pathname]) return titulos[pathname]
  if (pathname.match(/^\/admin\/produtos\/[^/]+$/)) return 'Editar Produto'
  if (pathname.match(/^\/admin\/encomendas\/[^/]+$/)) return 'Encomenda'
  if (pathname.match(/^\/admin\/clientes\/[^/]+$/)) return 'Cliente'
  if (pathname.match(/^\/admin\/pagamentos\/[^/]+$/)) return 'Pagamento'
  return 'Admin'
}

interface Props {
  adminNome: string
}

export default function TopBar({ adminNome }: Props) {
  const pathname = usePathname()
  const titulo = derivarTitulo(pathname)
  const initial = adminNome.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 bg-white border-b border-gray-100 lg:px-8">
      <h1
        className="text-sm font-medium tracking-widest uppercase text-noir"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {titulo}
      </h1>
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
          {adminNome}
        </span>
        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-semibold">
          {initial}
        </div>
      </div>
    </header>
  )
}
