'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/produtos', icon: Package, label: 'Produtos' },
  { href: '/admin/encomendas', icon: ShoppingBag, label: 'Encomendas' },
  { href: '/admin/clientes', icon: Users, label: 'Clientes' },
  { href: '/admin/pagamentos', icon: CreditCard, label: 'Pagamentos' },
  { href: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
]

interface Props {
  adminNome: string
  adminEmail: string
  badgeCounts: { pagamentos: number }
}

export default function Sidebar({ adminNome, adminEmail, badgeCounts }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const initial = adminNome.charAt(0).toUpperCase()

  const NavContent = (
    <nav className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/admin/dashboard" onClick={() => setOpen(false)}>
          <span
            className="text-2xl tracking-[0.4em] text-gold font-light font-serif"
          >
            KK
          </span>
          <span
            className="block text-[10px] tracking-spaced-xl uppercase text-muted mt-1 font-sans"
          >
            Kima Kyami
          </span>
        </Link>
      </div>

      <ul className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const badge = label === 'Pagamentos' ? badgeCounts.pagamentos : 0

          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-sans ${
                  isActive
                    ? 'bg-gold/10 text-gold border-l-2 border-gold pl-[10px]'
                    : 'text-muted hover:text-cream hover:bg-white/5 border-l-2 border-transparent pl-[10px]'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="tracking-wide">{label}</span>
                {badge > 0 && (
                  <span className="ml-auto bg-gold text-noir text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="px-3 py-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-semibold shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-cream truncate">{adminNome}</p>
            <p className="text-[10px] text-muted truncate">{adminEmail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-muted hover:text-red-400 transition-colors rounded-lg hover:bg-white/5 font-sans"
        >
          <LogOut size={16} aria-hidden="true" />
          <span className="tracking-wide">Terminar sessão</span>
        </button>
      </div>
    </nav>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu de navegação"
        aria-expanded={open ? "true" : "false"}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-noir rounded-lg border border-white/10 text-cream"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-noir flex flex-col border-r border-white/10 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu de navegação"
          className="lg:hidden absolute top-4 right-4 text-muted hover:text-cream"
        >
          <X size={20} aria-hidden="true" />
        </button>
        {NavContent}
      </aside>
    </>
  )
}
