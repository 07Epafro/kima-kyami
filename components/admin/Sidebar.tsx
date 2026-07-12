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
  Plus,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/produtos',  icon: Package,          label: 'Produtos'   },
  { href: '/admin/encomendas',icon: ShoppingBag,       label: 'Encomendas' },
  { href: '/admin/clientes',  icon: Users,             label: 'Clientes'   },
  { href: '/admin/pagamentos',icon: CreditCard,        label: 'Pagamentos' },
  { href: '/admin/configuracoes', icon: Settings,      label: 'Configurações' },
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
      {/* Brand */}
      <div className="px-6 py-7 border-b border-white/8">
        <Link href="/admin/dashboard" onClick={() => setOpen(false)}>
          <span className="text-xl tracking-[0.06em] font-light font-display text-a-gold whitespace-nowrap">
            Kima Kyami
          </span>
          <span className="block text-[8.5px] tracking-[0.32em] uppercase text-white/35 mt-1.5 font-ui">
            Luxury Management
          </span>
        </Link>
      </div>

      {/* Nav */}
      <ul className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const badge = label === 'Pagamentos' ? badgeCounts.pagamentos : 0

          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 min-h-11 rounded text-[10px] tracking-[0.18em] uppercase transition-all font-ui ${
                  isActive
                    ? 'bg-a-gold/10 text-a-gold border-l-2 border-a-gold pl-[10px]'
                    : 'text-white/45 hover:text-white hover:bg-white/5 border-l-2 border-transparent pl-[10px]'
                }`}
              >
                <Icon size={15} strokeWidth={1.5} className="shrink-0" />
                <span>{label}</span>
                {badge > 0 && (
                  <span className="ml-auto bg-a-gold text-a-charcoal text-[9px] font-semibold px-1.5 py-0.5 rounded-full font-ui">
                    {badge}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Novo produto */}
      <div className="px-4 pb-4">
        <Link
          href="/admin/produtos/novo"
          onClick={() => setOpen(false)}
          className="flex items-center justify-center gap-2 w-full border border-a-gold/40 text-a-gold text-[10px] tracking-[0.18em] uppercase px-3 py-2.5 rounded hover:bg-a-gold/10 hover:border-a-gold transition-colors font-ui"
        >
          <Plus size={13} strokeWidth={1.5} aria-hidden="true" />
          <span>Novo Produto</span>
        </Link>
      </div>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/8 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-sm bg-a-gold/15 flex items-center justify-center text-a-gold text-xs font-semibold shrink-0 font-ui">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-white/70 truncate font-ui">{adminNome}</p>
            <p className="text-[10px] text-white/35 truncate font-ui">{adminEmail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-[10px] tracking-[0.18em] uppercase text-white/35 hover:text-red-400 transition-colors rounded hover:bg-white/5 font-ui"
        >
          <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>Terminar Sessão</span>
        </button>
      </div>
    </nav>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu de navegação"
        aria-expanded={open}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-a-charcoal rounded border border-white/10 text-white/70"
      >
        <Menu size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-a-charcoal flex flex-col border-r border-white/8 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
          className="lg:hidden absolute top-4 right-4 text-white/35 hover:text-white"
        >
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
        {NavContent}
      </aside>
    </>
  )
}
