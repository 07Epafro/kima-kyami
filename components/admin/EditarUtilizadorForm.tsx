'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Power, ShieldAlert } from 'lucide-react'
import { useConfirm } from './ConfirmDialog'

const labelClass = 'text-[9.5px] tracking-[0.2em] uppercase text-a-muted mb-1.5 block font-ui'
const inputClass = 'w-full bg-white border border-a-border text-a-charcoal text-[13px] px-4 py-2.5 rounded-lg focus:outline-none focus:border-a-gold transition-colors placeholder:text-a-muted/40 font-ui'

interface Props {
  utilizador: { id: string; nome: string; email: string; role: 'SUPER_ADMIN' | 'GESTOR'; ativo: boolean }
  souEu: boolean
}

export default function EditarUtilizadorForm({ utilizador, souEu }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ nome: utilizador.nome, email: utilizador.email, role: utilizador.role })
  const [ativo, setAtivo] = useState(utilizador.ativo)
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const { confirmar, dialog } = useConfirm()

  async function patch(data: Record<string, unknown>) {
    const res = await fetch(`/api/admin/utilizadores/${utilizador.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof json.error === 'string' ? json.error : 'Erro ao guardar')
    }
    return json
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (aGuardar) return
    setAGuardar(true)
    setErro(null)
    setSucesso(false)
    try {
      await patch(form)
      setSucesso(true)
      router.refresh()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao guardar')
    } finally {
      setAGuardar(false)
    }
  }

  async function alternarAtivo() {
    if (ativo) {
      const ok = await confirmar('Desactivar esta conta?', {
        descricao: 'A pessoa deixa de conseguir entrar no painel imediatamente após a próxima tentativa de login.',
        labelConfirmar: 'Desactivar',
        perigo: true,
      })
      if (!ok) return
    }
    setErro(null)
    try {
      await patch({ ativo: !ativo })
      setAtivo((v) => !v)
      router.refresh()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao actualizar')
    }
  }

  return (
    <div className="space-y-5">
      {dialog}

      <form onSubmit={guardar} className="bg-white border border-a-border rounded-lg shadow-sm p-6 sm:p-8 space-y-5">
        <div>
          <label htmlFor="nome" className={labelClass}>Nome</label>
          <input
            id="nome" type="text" required
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email" type="email" required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="role" className={labelClass}>Função</label>
          <select
            id="role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'SUPER_ADMIN' | 'GESTOR' }))}
            className={inputClass}
          >
            <option value="GESTOR">Gestor — acesso operacional</option>
            <option value="SUPER_ADMIN">Super Admin — acesso total, incluindo utilizadores</option>
          </select>
        </div>

        {erro && (
          <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg font-ui">{erro}</p>
        )}
        {sucesso && (
          <p className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg font-ui">
            Alterações guardadas.
          </p>
        )}

        <button
          type="submit"
          disabled={aGuardar}
          className="flex items-center justify-center gap-2 w-full bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase px-6 min-h-12 rounded-lg hover:bg-a-charcoal/90 transition-colors disabled:opacity-50 font-ui"
        >
          {aGuardar ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={13} strokeWidth={1.5} />
          )}
          {aGuardar ? 'A guardar…' : 'Guardar alterações'}
        </button>
      </form>

      <div className="bg-white border border-a-border rounded-lg shadow-sm p-6 sm:p-8 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-a-charcoal font-ui mb-1">
            {ativo ? 'Conta activa' : 'Conta desactivada'}
          </p>
          <p className="text-[12px] text-a-muted font-ui">
            {ativo ? 'Consegue entrar no painel normalmente.' : 'Não consegue entrar no painel.'}
          </p>
        </div>
        {souEu ? (
          <span className="flex items-center gap-1.5 text-[10px] text-a-muted font-ui shrink-0" title="Não podes desactivar a tua própria conta">
            <ShieldAlert size={13} strokeWidth={1.5} /> A tua conta
          </span>
        ) : (
          <button
            type="button"
            onClick={alternarAtivo}
            className={`flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase px-5 min-h-11 rounded-lg transition-colors font-ui shrink-0 ${
              ativo
                ? 'border border-red-300 text-red-600 hover:bg-red-50'
                : 'bg-a-charcoal text-white hover:bg-a-charcoal/90'
            }`}
          >
            <Power size={13} strokeWidth={1.5} />
            {ativo ? 'Desactivar' : 'Reactivar'}
          </button>
        )}
      </div>
    </div>
  )
}
