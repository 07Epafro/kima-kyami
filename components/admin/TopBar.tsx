'use client'

import { usePathname } from 'next/navigation'

const titulos: Record<string, string> = {
  '/admin/dashboard':     'Dashboard',
  '/admin/produtos':      'Produtos',
  '/admin/produtos/novo': 'Novo Produto',
  '/admin/encomendas':    'Encomendas',
  '/admin/clientes':      'Clientes',
  '/admin/pagamentos':    'Pagamentos',
  '/admin/configuracoes': 'Configurações',
}

function derivarTitulo(pathname: string): string {
  if (titulos[pathname]) return titulos[pathname]
  if (pathname.match(/^\/admin\/produtos\/[^/]+$/))   return 'Editar Produto'
  if (pathname.match(/^\/admin\/encomendas\/[^/]+$/)) return 'Encomenda'
  if (pathname.match(/^\/admin\/clientes\/[^/]+$/))   return 'Cliente'
  if (pathname.match(/^\/admin\/pagamentos\/[^/]+$/)) return 'Pagamento'
  return 'Admin'
}

interface Props { adminNome: string }

export default function TopBar({ adminNome }: Props) {
  const pathname = usePathname()
  const titulo = derivarTitulo(pathname)
  const initial = adminNome.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between pl-16 pr-6 bg-white border-b border-a-border lg:pl-8">
      <h1 className="text-[11px] tracking-[0.22em] uppercase font-medium text-a-charcoal font-ui">
        {titulo}
      </h1>
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-[11px] text-a-muted font-ui">
          {adminNome}
        </span>
        <div className="w-7 h-7 rounded-sm bg-a-gold/15 flex items-center justify-center text-a-gold text-xs font-semibold font-ui">
          {initial}
        </div>
      </div>
    </header>
  )
}
