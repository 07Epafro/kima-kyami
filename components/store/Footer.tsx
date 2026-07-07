'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Instagram, Send } from 'lucide-react'

const INFO_LINKS = [
  { href: '/marca', label: 'A Marca' },
  { href: '/colecoes', label: 'Coleções' },
  { href: '/lookbook', label: 'Lookbook' },
  { href: '/contactos', label: 'Contactos' },
  { href: '/faq', label: 'Perguntas Frequentes' },
]

const AJUDA_LINKS = [
  { href: '/envios', label: 'Envios e Entregas' },
  { href: '/trocas-e-devolucoes', label: 'Trocas e Devoluções' },
  { href: '/privacidade', label: 'Política de Privacidade' },
  { href: '/termos', label: 'Termos e Condições' },
]

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z" />
    </svg>
  )
}

function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  )
}

export default function Footer() {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  async function subscrever(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || estado === 'loading') return
    setEstado('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setEstado(res.ok ? 'ok' : 'error')
      if (res.ok) setEmail('')
    } catch {
      setEstado('error')
    }
  }

  return (
    <footer className="bg-noir text-cream font-sans">
      {/* Main footer grid */}
      <div className="container-kk py-16 lg:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Col 1: Brand */}
          <div className="space-y-6">
            <Link href="/" className="inline-block" aria-label="Kima Kyami — Início">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-cream.svg"
                alt="Kima Kyami"
                width={110}
                height={44}
                className="object-contain h-10 w-auto"
              />
            </Link>
            <p className="text-[11px] text-cream/50 leading-relaxed tracking-wide max-w-[200px]">
              Sapatos criados para mulheres que deixam presença por onde passam.
            </p>
            {/* Social links — p-2 garante touch target ~44px */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com/kimakyami"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2 -m-2 text-cream/40 hover:text-gold transition-colors"
              >
                <Instagram size={16} strokeWidth={1.5} />
              </a>
              <a
                href="https://tiktok.com/@kimakyami"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="p-2 -m-2 text-cream/40 hover:text-gold transition-colors"
              >
                <TikTokIcon />
              </a>
              <a
                href="https://pinterest.com/kimakyami"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="p-2 -m-2 text-cream/40 hover:text-gold transition-colors"
              >
                <PinterestIcon />
              </a>
            </div>
          </div>

          {/* Col 2: Informações */}
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-cream/70 mb-6">
              Informações
            </p>
            <ul className="space-y-3.5">
              {INFO_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[12px] text-cream/60 hover:text-gold transition-colors tracking-wide"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Ajuda */}
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-cream/70 mb-6">
              Ajuda
            </p>
            <ul className="space-y-3.5">
              {AJUDA_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[12px] text-cream/60 hover:text-gold transition-colors tracking-wide"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-cream/70 mb-6">
              Newsletter
            </p>
            <p className="text-[12px] text-cream/60 leading-relaxed mb-5">
              As primeiras a saber. Novos lançamentos e ofertas exclusivas.
            </p>

            {estado === 'ok' ? (
              <p className="text-[12px] text-gold leading-relaxed">
                ✓ Subscrita com sucesso. Bem-vinda.
              </p>
            ) : (
              <form onSubmit={subscrever} className="space-y-2">
                <div className="flex border border-cream/20 focus-within:border-gold transition-colors">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="O teu email"
                    required
                    className="flex-1 bg-transparent px-4 py-3 text-[11px] text-cream placeholder:text-cream/30 focus:outline-none min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={estado === 'loading'}
                    aria-label="Subscrever newsletter"
                    className="px-4 text-cream/70 hover:text-gold transition-colors disabled:opacity-50"
                  >
                    <Send size={14} strokeWidth={1.5} />
                  </button>
                </div>
                {estado === 'error' && (
                  <p className="text-[11px] text-red-400">
                    Erro. Tenta novamente.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-cream/10">
        <div className="container-kk py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-cream/40 tracking-[0.2em]">
            © {new Date().getFullYear()} KIMA KYAMI. TODOS OS DIREITOS RESERVADOS.
          </p>
          <a
            href="https://www.instagram.com/ubuntucode"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 group"
            aria-label="Desenvolvido pela UbuntuCode"
          >
            <span className="text-[10px] text-cream/35 tracking-[0.18em] group-hover:text-cream/55 transition-colors">
              DESENVOLVIDO PELA
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ubuntucode.svg"
              alt="UbuntuCode"
              width={80}
              height={20}
              className="object-contain h-4 w-auto opacity-30 group-hover:opacity-55 transition-opacity"
            />
          </a>
        </div>
      </div>
    </footer>
  )
}
