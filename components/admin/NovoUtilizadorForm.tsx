'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, CheckCircle } from 'lucide-react'

const labelClass = 'text-[9.5px] tracking-[0.2em] uppercase text-a-muted mb-1.5 block font-ui'
const inputClass = 'w-full bg-white border border-a-border text-a-charcoal text-[13px] px-4 py-2.5 rounded-lg focus:outline-none focus:border-a-gold transition-colors placeholder:text-a-muted/40 font-ui'

export default function NovoUtilizadorForm() {
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', email: '', role: 'GESTOR' })
  const [estado, setEstado] = useState<'idle' | 'a-guardar' | 'erro'>('idle')
  const [erro, setErro] = useState<string | null>(null)
  const [criado, setCriado] = useState<{ nome: string; email: string } | null>(null)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (estado === 'a-guardar') return
    setEstado('a-guardar')
    setErro(null)
    try {
      const res = await fetch('/api/admin/utilizadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(typeof json.error === 'string' ? json.error : 'Erro ao criar utilizador')
        setEstado('erro')
        return
      }
      setCriado({ nome: form.nome, email: form.email })
    } catch {
      setErro('Erro de rede. Tenta novamente.')
      setEstado('erro')
    }
  }

  if (criado) {
    return (
      <div className="bg-white border border-a-border rounded-lg shadow-sm p-6 sm:p-8 text-center">
        <CheckCircle size={28} strokeWidth={1.5} className="text-emerald-500 mx-auto mb-4" />
        <p className="text-sm text-a-charcoal font-ui mb-1">
          <strong>{criado.nome}</strong> foi adicionado(a).
        </p>
        <p className="text-[13px] text-a-muted font-ui mb-6">
          Enviámos um email para {criado.email} com um link para definir a password.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => { setCriado(null); setForm({ nome: '', email: '', role: 'GESTOR' }); setEstado('idle') }}
            className="text-[11px] text-a-muted hover:text-a-charcoal transition-colors font-ui"
          >
            Adicionar outro
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/utilizadores')}
            className="bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase px-6 min-h-11 rounded-lg hover:bg-a-charcoal/90 transition-colors font-ui"
          >
            Ver utilizadores
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={guardar} className="bg-white border border-a-border rounded-lg shadow-sm p-6 sm:p-8 space-y-5">
      <div>
        <label htmlFor="nome" className={labelClass}>Nome</label>
        <input
          id="nome" type="text" required
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          className={inputClass}
          placeholder="Nome completo"
        />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input
          id="email" type="email" required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={inputClass}
          placeholder="nome@kimakyami.ao"
        />
      </div>
      <div>
        <label htmlFor="role" className={labelClass}>Função</label>
        <select
          id="role"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className={inputClass}
        >
          <option value="GESTOR">Gestor — acesso operacional</option>
          <option value="SUPER_ADMIN">Super Admin — acesso total, incluindo utilizadores</option>
        </select>
      </div>

      {erro && (
        <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg font-ui">{erro}</p>
      )}

      <button
        type="submit"
        disabled={estado === 'a-guardar'}
        className="flex items-center justify-center gap-2 w-full bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase px-6 min-h-12 rounded-lg hover:bg-a-charcoal/90 transition-colors disabled:opacity-50 font-ui"
      >
        {estado === 'a-guardar' ? (
          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <UserPlus size={13} strokeWidth={1.5} />
        )}
        {estado === 'a-guardar' ? 'A criar…' : 'Criar utilizador'}
      </button>
    </form>
  )
}
