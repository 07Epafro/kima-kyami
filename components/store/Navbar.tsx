'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'

const LINKS = [
  { href: '/', label: 'INÍCIO' },
  { href: '/marca', label: 'A MARCA' },
  { href: '/colecoes', label: 'COLEÇÕES' },
  { href: '/lookbook', label: 'LOOKBOOK' },
  { href: '/contactos', label: 'CONTACTOS' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { count, openCart } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    if (menuOpen) closeButtonRef.current?.focus()
  }, [menuOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && menuOpen) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
      {/* Announcement bar */}
      <div
        className="bg-noir text-cream text-center py-2.5 text-[9px] tracking-[0.35em] font-light"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        BREVEMENTE, ALGO EXCLUSIVO ESTÁ A CHEGAR.
      </div>

      {/* Main navbar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 bg-cream ${
          scrolled ? 'border-b border-noir/10 shadow-[0_2px_20px_rgba(24,24,24,0.06)]' : ''
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-16">
          <div className="relative flex items-center h-[60px] lg:h-[72px]">

            {/* Left: hamburger (mobile) / nav links (desktop) */}
            <div className="flex items-center flex-1">
              {/* Mobile hamburger — left side */}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menu"
                className="lg:hidden text-noir/55 hover:text-gold transition-colors"
              >
                <Menu size={20} strokeWidth={1.5} />
              </button>

              {/* Desktop nav links */}
              <nav className="hidden lg:flex items-center gap-8">
                {LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`text-[9.5px] tracking-[0.22em] transition-colors whitespace-nowrap ${
                      pathname === href ? 'text-gold' : 'text-noir/55 hover:text-noir'
                    }`}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center: logo (absolutely centered) */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
              aria-label="Kima Kyami — Início"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Kima Kyami"
                width={100}
                height={40}
                className="object-contain h-8 lg:h-10 w-auto"
              />
            </Link>

            {/* Right: icons */}
            <div className="flex items-center gap-5 flex-1 justify-end">
              <button
                type="button"
                aria-label="Pesquisar"
                className="hidden lg:block text-noir/55 hover:text-gold transition-colors"
              >
                <Search size={16} strokeWidth={1.5} />
              </button>

              <Link
                href="/conta"
                aria-label="A minha conta"
                className="hidden lg:block text-noir/55 hover:text-gold transition-colors"
              >
                <User size={16} strokeWidth={1.5} />
              </Link>

              <button
                type="button"
                onClick={openCart}
                aria-label={`Carrinho — ${count} ${count === 1 ? 'artigo' : 'artigos'}`}
                className="relative text-noir/55 hover:text-gold transition-colors"
              >
                <ShoppingBag size={16} strokeWidth={1.5} />
                {count > 0 && (
                  <span
                    key={count}
                    className="absolute -top-2 -right-2 bg-gold text-noir text-[8px] font-semibold rounded-full w-4 h-4 flex items-center justify-center leading-none animate-kk-pop"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={`fixed inset-0 z-50 bg-noir flex flex-col transition-all duration-400 ${
          menuOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
        aria-hidden={menuOpen ? undefined : true}
      >
        {/* Mobile menu header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-cream.svg"
            alt="Kima Kyami"
            width={90}
            height={36}
            className="object-contain h-8 w-auto"
          />
          <button
            type="button"
            ref={closeButtonRef}
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
            className="text-cream/40 hover:text-gold transition-colors"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {/* Mobile nav links */}
        <nav className="flex flex-col justify-center flex-1 px-8 gap-0">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`text-[clamp(26px,7vw,40px)] tracking-[0.2em] font-light py-4 border-b border-cream/8 transition-colors ${
                pathname === href ? 'text-gold' : 'text-cream/65 hover:text-cream'
              }`}
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu footer */}
        <div className="flex items-center gap-8 px-8 py-8 border-t border-cream/8">
          <button type="button" aria-label="Pesquisar" className="text-cream/35 hover:text-gold transition-colors">
            <Search size={18} strokeWidth={1.5} />
          </button>
          <Link
            href="/conta"
            onClick={() => setMenuOpen(false)}
            aria-label="A minha conta"
            className="text-cream/35 hover:text-gold transition-colors"
          >
            <User size={18} strokeWidth={1.5} />
          </Link>
          <button
            type="button"
            onClick={() => { setMenuOpen(false); openCart() }}
            aria-label="Carrinho"
            className="text-cream/35 hover:text-gold transition-colors relative"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gold text-noir text-[8px] font-semibold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
