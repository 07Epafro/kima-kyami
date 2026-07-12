'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'

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

interface Props {
  adminNome: string
  pagamentosPendentes?: number
}

export default function TopBar({ adminNome, pagamentosPendentes = 0 }: Props) {
  const pathname = usePathname()
  const titulo = derivarTitulo(pathname)
  const initial = adminNome.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between pl-16 pr-4 sm:pr-6 bg-a-charcoal border-b border-white/8 lg:pl-8 lg:pr-8">
      <h1 className="text-base sm:text-lg tracking-[0.18em] uppercase font-light text-white font-display truncate">
        {titulo}
      </h1>
      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        <Link
          href="/admin/pagamentos"
          aria-label={
            pagamentosPendentes > 0
              ? `${pagamentosPendentes} pagamento${pagamentosPendentes !== 1 ? 's' : ''} pendente${pagamentosPendentes !== 1 ? 's' : ''}`
              : 'Notificações'
          }
          className="relative p-2 rounded text-white/50 hover:text-a-gold hover:bg-white/5 transition-colors"
        >
          <Bell size={16} strokeWidth={1.5} aria-hidden="true" />
          {pagamentosPendentes > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-a-gold ring-2 ring-a-charcoal" />
          )}
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-[10px] tracking-[0.18em] uppercase text-white/60 font-ui">
            {adminNome}
          </span>
          <div className="w-7 h-7 rounded-sm bg-a-gold/15 flex items-center justify-center text-a-gold text-xs font-semibold font-ui">
            {initial}
          </div>
        </div>
      </div>
    </header>
  )
}
