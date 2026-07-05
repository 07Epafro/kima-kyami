'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Instagram } from 'lucide-react'

export default function ContactosPage() {
  const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' })
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (estado === 'loading') return
    setEstado('loading')
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setEstado(res.ok ? 'ok' : 'error')
    } catch {
      setEstado('error')
    }
  }

  const inputClass = `w-full bg-transparent border border-noir/20 px-4 py-3.5 text-[12px] text-noir placeholder:text-noir/30 focus:outline-none focus:border-gold transition-colors`

  return (
    <>
      {/* ─── Header ─── */}
      <section className="bg-cream pt-20 pb-12 text-center px-8">
        <p
          className="text-[9px] tracking-[0.45em] uppercase text-gold mb-4"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Fala Connosco
        </p>
        <h1
          className="text-noir text-[clamp(32px,5vw,56px)] font-light tracking-[0.15em] uppercase"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          CONTACTOS
        </h1>
        <div className="w-8 h-px bg-gold mx-auto mt-8" />
      </section>

      {/* ─── Grid: Info + Form ─── */}
      <section className="bg-cream pb-24 px-8 lg:px-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

          {/* Info */}
          <div className="space-y-10">
            <div>
              <p
                className="text-[9px] tracking-[0.35em] uppercase text-noir/35 mb-8"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Informações
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail size={15} strokeWidth={1.5} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-noir/35 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
                      Email
                    </p>
                    <a
                      href="mailto:geral@kimakyami.ao"
                      className="text-[13px] text-noir hover:text-gold transition-colors tracking-wide"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      geral@kimakyami.ao
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone size={15} strokeWidth={1.5} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-noir/35 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
                      WhatsApp
                    </p>
                    <a
                      href="https://wa.me/244900000000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-noir hover:text-gold transition-colors tracking-wide"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      +244 900 000 000
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin size={15} strokeWidth={1.5} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-noir/35 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
                      Localização
                    </p>
                    <p className="text-[13px] text-noir tracking-wide" style={{ fontFamily: 'var(--font-sans)' }}>
                      Luanda, Angola
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Instagram size={15} strokeWidth={1.5} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-noir/35 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
                      Instagram
                    </p>
                    <a
                      href="https://instagram.com/kimakyami"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-noir hover:text-gold transition-colors tracking-wide"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      @kimakyami
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-noir/8 pt-10">
              <p
                className="text-[9px] tracking-[0.35em] uppercase text-noir/35 mb-4"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Horário de Atendimento
              </p>
              <p className="text-[13px] text-noir/60 leading-[1.9]" style={{ fontFamily: 'var(--font-sans)' }}>
                Segunda — Sexta: 09h00 – 18h00<br />
                Sábado: 10h00 – 14h00<br />
                Domingo: Encerrado
              </p>
            </div>
          </div>

          {/* Form */}
          <div>
            <p
              className="text-[9px] tracking-[0.35em] uppercase text-noir/35 mb-8"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Enviar Mensagem
            </p>

            {estado === 'ok' ? (
              <div className="border border-gold/30 bg-gold/5 px-8 py-12 text-center">
                <p className="text-gold text-[11px] tracking-[0.3em] uppercase mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
                  Mensagem Enviada
                </p>
                <p className="text-noir/60 text-[13px]" style={{ fontFamily: 'var(--font-sans)' }}>
                  Respondemos em até 24 horas.
                </p>
              </div>
            ) : (
              <form onSubmit={enviar} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nome"
                    required
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    className={inputClass}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className={inputClass}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Assunto"
                  required
                  value={form.assunto}
                  onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))}
                  className={inputClass}
                  style={{ fontFamily: 'var(--font-sans)' }}
                />
                <textarea
                  placeholder="A tua mensagem"
                  required
                  rows={6}
                  value={form.mensagem}
                  onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
                  className={`${inputClass} resize-none`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                />
                {estado === 'error' && (
                  <p className="text-red-400 text-[11px]" style={{ fontFamily: 'var(--font-sans)' }}>
                    Erro ao enviar. Tenta novamente.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={estado === 'loading'}
                  className="w-full bg-noir text-cream text-[10px] tracking-[0.3em] uppercase py-4 hover:bg-gold hover:text-noir transition-colors disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {estado === 'loading' ? 'A ENVIAR...' : 'ENVIAR MENSAGEM'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
