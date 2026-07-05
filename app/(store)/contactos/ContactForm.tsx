'use client'

import { useState } from 'react'

const inputClass = `w-full bg-transparent border border-noir/20 px-4 py-3.5 text-[12px] text-noir placeholder:text-noir/30 focus:outline-none focus:border-gold transition-colors`

export default function ContactForm() {
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
      if (res.ok) {
        setEstado('ok')
        setForm({ nome: '', email: '', assunto: '', mensagem: '' })
      } else {
        setEstado('error')
      }
    } catch {
      setEstado('error')
    }
  }

  if (estado === 'ok') {
    return (
      <div className="border border-gold/30 bg-gold/5 px-8 py-12 text-center">
        <p className="text-gold text-[11px] tracking-[0.3em] uppercase mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
          Mensagem Enviada
        </p>
        <p className="text-noir/60 text-[13px]" style={{ fontFamily: 'var(--font-sans)' }}>
          Respondemos em até 24 horas.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cf-nome" className="sr-only">Nome</label>
          <input
            id="cf-nome"
            type="text"
            placeholder="Nome"
            required
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            className={inputClass}
            style={{ fontFamily: 'var(--font-sans)' }}
          />
        </div>
        <div>
          <label htmlFor="cf-email" className="sr-only">Email</label>
          <input
            id="cf-email"
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className={inputClass}
            style={{ fontFamily: 'var(--font-sans)' }}
          />
        </div>
      </div>
      <div>
        <label htmlFor="cf-assunto" className="sr-only">Assunto</label>
        <input
          id="cf-assunto"
          type="text"
          placeholder="Assunto"
          required
          value={form.assunto}
          onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))}
          className={inputClass}
          style={{ fontFamily: 'var(--font-sans)' }}
        />
      </div>
      <div>
        <label htmlFor="cf-mensagem" className="sr-only">Mensagem</label>
        <textarea
          id="cf-mensagem"
          placeholder="A tua mensagem"
          required
          rows={6}
          value={form.mensagem}
          onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
          className={`${inputClass} resize-none`}
          style={{ fontFamily: 'var(--font-sans)' }}
        />
      </div>
      {estado === 'error' && (
        <p className="text-red-400 text-[11px]" role="alert" style={{ fontFamily: 'var(--font-sans)' }}>
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
  )
}
