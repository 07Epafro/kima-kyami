'use client'

import { useState, useEffect } from 'react'
import { Save, CheckCircle } from 'lucide-react'

const labelClass = 'text-[9.5px] tracking-[0.2em] uppercase text-a-muted mb-1.5 block font-ui'
const inputClass = 'w-full bg-white border border-a-border text-a-charcoal text-[13px] px-4 py-2.5 rounded-lg focus:outline-none focus:border-a-gold transition-colors placeholder:text-a-muted/40 font-ui'

export default function ConfiguracoesPage() {
  const [form, setForm] = useState({
    email: '',
    whatsapp: '',
    whatsappUrl: '',
    instagram: '',
    instagramUrl: '',
    localizacao: '',
    horario: '',
  })
  const [estado, setEstado] = useState<'loading' | 'idle' | 'saving' | 'ok' | 'error'>('loading')

  useEffect(() => {
    fetch('/api/configuracoes')
      .then(r => r.json())
      .then(data => {
        setForm({
          email: data.email ?? '',
          whatsapp: data.whatsapp ?? '',
          whatsappUrl: data.whatsappUrl ?? '',
          instagram: data.instagram ?? '',
          instagramUrl: data.instagramUrl ?? '',
          localizacao: data.localizacao ?? '',
          horario: data.horario ?? '',
        })
        setEstado('idle')
      })
      .catch(() => setEstado('error'))
  }, [])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (estado === 'saving') return
    setEstado('saving')
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setEstado(res.ok ? 'ok' : 'error')
      if (res.ok) setTimeout(() => setEstado('idle'), 3000)
    } catch {
      setEstado('error')
    }
  }

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-light text-a-charcoal tracking-tight font-display">
          Configurações da Loja
        </h1>
        <p className="text-sm text-a-muted mt-1 font-ui">
          Dados de contacto exibidos na página pública de contactos.
        </p>
      </div>

      {estado === 'loading' ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-5 h-5 border-2 border-a-gold/30 border-t-a-gold rounded-full animate-spin" />
          <span className="text-a-muted text-sm font-ui">A carregar...</span>
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-5">
          {/* Contacto */}
          <section className="space-y-4 bg-white border border-a-border rounded-lg p-5 sm:p-6">
            <p className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted pb-3 border-b border-a-border font-ui">
              Contacto
            </p>
            <div>
              <label htmlFor="cfg-email" className={labelClass}>Email público</label>
              <input id="cfg-email" type="email" value={form.email} onChange={field('email')} className={inputClass} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cfg-whatsapp" className={labelClass}>WhatsApp (exibição)</label>
                <input id="cfg-whatsapp" type="text" value={form.whatsapp} onChange={field('whatsapp')} className={inputClass} placeholder="+244 9XXXXXXXX" required />
              </div>
              <div>
                <label htmlFor="cfg-whatsapp-url" className={labelClass}>WhatsApp (link wa.me)</label>
                <input id="cfg-whatsapp-url" type="url" value={form.whatsappUrl} onChange={field('whatsappUrl')} className={inputClass} placeholder="https://wa.me/244..." required />
              </div>
            </div>
          </section>

          {/* Redes sociais */}
          <section className="space-y-4 bg-white border border-a-border rounded-lg p-5 sm:p-6">
            <p className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted pb-3 border-b border-a-border font-ui">
              Redes Sociais
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cfg-instagram" className={labelClass}>Instagram (exibição)</label>
                <input id="cfg-instagram" type="text" value={form.instagram} onChange={field('instagram')} className={inputClass} placeholder="@kimakyami" required />
              </div>
              <div>
                <label htmlFor="cfg-instagram-url" className={labelClass}>Instagram (URL)</label>
                <input id="cfg-instagram-url" type="url" value={form.instagramUrl} onChange={field('instagramUrl')} className={inputClass} placeholder="https://instagram.com/..." required />
              </div>
            </div>
          </section>

          {/* Localização & Horário */}
          <section className="space-y-4 bg-white border border-a-border rounded-lg p-5 sm:p-6">
            <p className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted pb-3 border-b border-a-border font-ui">
              Localização & Horário
            </p>
            <div>
              <label htmlFor="cfg-localizacao" className={labelClass}>Localização</label>
              <input id="cfg-localizacao" type="text" value={form.localizacao} onChange={field('localizacao')} className={inputClass} placeholder="Luanda, Angola" required />
            </div>
            <div>
              <label htmlFor="cfg-horario" className={labelClass}>Horário de atendimento (uma linha por período)</label>
              <textarea
                id="cfg-horario"
                value={form.horario}
                onChange={field('horario')}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder={'Segunda — Sexta: 09h00 – 18h00\nSábado: 10h00 – 14h00\nDomingo: Encerrado'}
                required
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={estado === 'saving'}
              className="flex items-center gap-2 bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase px-6 min-h-12 rounded-lg hover:bg-a-charcoal/90 transition-colors disabled:opacity-50 font-ui"
            >
              {estado === 'saving' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  A GUARDAR...
                </>
              ) : (
                <>
                  <Save size={13} />
                  GUARDAR ALTERAÇÕES
                </>
              )}
            </button>
            {estado === 'ok' && (
              <span className="flex items-center gap-1.5 text-[11px] text-green-600 font-ui">
                <CheckCircle size={13} />
                Guardado com sucesso
              </span>
            )}
            {estado === 'error' && (
              <span className="text-[11px] text-red-500 font-ui">
                Erro ao guardar. Tenta novamente.
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
