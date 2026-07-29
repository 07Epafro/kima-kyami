'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, X, Check, Landmark } from 'lucide-react'
import { useConfirm } from './ConfirmDialog'

interface ContaBancaria {
  id: string
  banco: string
  titular: string
  iban: string
  ativo: boolean
  criadoEm: string
}

type ContaForm = { banco: string; titular: string; iban: string; ativo: boolean }

const CONTA_VAZIA: ContaForm = { banco: '', titular: '', iban: '', ativo: true }

const labelClass = 'text-[9.5px] tracking-[0.2em] uppercase text-a-muted mb-1.5 block font-ui'
const inputClass = 'w-full bg-white border border-a-border text-a-charcoal text-[13px] px-4 py-2.5 rounded-lg focus:outline-none focus:border-a-gold transition-colors placeholder:text-a-muted/40 font-ui'

export default function ContasBancariasManager() {
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [estado, setEstado] = useState<'loading' | 'idle' | 'error'>('loading')
  const [aAdicionar, setAAdicionar] = useState(false)
  const [novo, setNovo] = useState<ContaForm>(CONTA_VAZIA)
  const [aGuardarNovo, setAGuardarNovo] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ContaForm>(CONTA_VAZIA)
  const [aGuardarEdicao, setAGuardarEdicao] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const { confirmar, dialog } = useConfirm()

  function carregar() {
    setEstado('loading')
    fetch('/api/contas-bancarias')
      .then(r => r.json())
      .then((data: { contas: ContaBancaria[] }) => {
        setContas(data.contas ?? [])
        setEstado('idle')
      })
      .catch(() => setEstado('error'))
  }

  useEffect(() => { carregar() }, [])

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (aGuardarNovo) return
    setErro(null)
    setAGuardarNovo(true)
    try {
      const res = await fetch('/api/contas-bancarias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novo),
      })
      if (res.ok) {
        setNovo(CONTA_VAZIA)
        setAAdicionar(false)
        carregar()
      } else {
        setErro('Erro ao adicionar conta bancária')
      }
    } catch {
      setErro('Erro ao adicionar conta bancária')
    } finally {
      setAGuardarNovo(false)
    }
  }

  function iniciarEdicao(conta: ContaBancaria) {
    setEditandoId(conta.id)
    setEditForm({ banco: conta.banco, titular: conta.titular, iban: conta.iban, ativo: conta.ativo })
  }

  async function guardarEdicao(id: string) {
    if (aGuardarEdicao) return
    setErro(null)
    setAGuardarEdicao(true)
    try {
      const res = await fetch(`/api/contas-bancarias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setEditandoId(null)
        carregar()
      } else {
        setErro('Erro ao guardar alterações')
      }
    } catch {
      setErro('Erro ao guardar alterações')
    } finally {
      setAGuardarEdicao(false)
    }
  }

  async function alternarAtivo(conta: ContaBancaria) {
    setContas(prev => prev.map(c => c.id === conta.id ? { ...c, ativo: !c.ativo } : c))
    const res = await fetch(`/api/contas-bancarias/${conta.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !conta.ativo }),
    })
    if (!res.ok) carregar() // reverte optimistic update em caso de falha
  }

  async function remover(id: string) {
    const ok = await confirmar('Desactivar esta conta bancária?', {
      descricao: 'Deixa de estar disponível no checkout, mas encomendas antigas mantêm o registo.',
      labelConfirmar: 'Desactivar',
      perigo: true,
    })
    if (!ok) return
    const res = await fetch(`/api/contas-bancarias/${id}`, { method: 'DELETE' })
    if (res.ok) carregar()
    else setErro('Erro ao desactivar conta bancária')
  }

  return (
    <section className="space-y-4 bg-white border border-a-border rounded-lg p-5 sm:p-6">
      {dialog}
      <div className="flex items-center justify-between pb-3 border-b border-a-border">
        <p className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted font-ui">
          Contas Bancárias
        </p>
        {!aAdicionar && (
          <button
            type="button"
            onClick={() => setAAdicionar(true)}
            className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-a-charcoal hover:text-a-gold transition-colors font-ui"
          >
            <Plus size={13} strokeWidth={1.5} /> Adicionar
          </button>
        )}
      </div>

      <p className="text-xs text-a-muted font-ui">
        Contas disponíveis para o cliente escolher no checkout ao efectuar transferência bancária.
      </p>

      {erro && (
        <p className="text-[11px] text-red-500 font-ui">{erro}</p>
      )}

      {/* Formulário de nova conta */}
      {aAdicionar && (
        <form onSubmit={adicionar} className="space-y-3 bg-a-bone border border-a-border rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="nova-conta-banco" className={labelClass}>Banco</label>
              <input
                id="nova-conta-banco"
                type="text"
                value={novo.banco}
                onChange={e => setNovo(f => ({ ...f, banco: e.target.value }))}
                className={inputClass}
                placeholder="BAI, BFA, Standard Bank…"
                required
              />
            </div>
            <div>
              <label htmlFor="nova-conta-titular" className={labelClass}>Titular</label>
              <input
                id="nova-conta-titular"
                type="text"
                value={novo.titular}
                onChange={e => setNovo(f => ({ ...f, titular: e.target.value }))}
                className={inputClass}
                placeholder="Ki Ma Kyami Lda"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="nova-conta-iban" className={labelClass}>IBAN</label>
            <input
              id="nova-conta-iban"
              type="text"
              value={novo.iban}
              onChange={e => setNovo(f => ({ ...f, iban: e.target.value }))}
              className={inputClass + ' font-mono'}
              placeholder="AO06 0000 0000 0000 0000 0000 0"
              required
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={aGuardarNovo}
              className="flex items-center gap-2 bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase px-5 min-h-10 rounded-lg hover:bg-a-charcoal/90 transition-colors disabled:opacity-50 font-ui"
            >
              {aGuardarNovo ? 'A guardar…' : 'Guardar conta'}
            </button>
            <button
              type="button"
              onClick={() => { setAAdicionar(false); setNovo(CONTA_VAZIA) }}
              className="text-[10px] tracking-[0.18em] uppercase text-a-muted hover:text-a-charcoal transition-colors font-ui"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de contas */}
      {estado === 'loading' ? (
        <div className="flex items-center gap-3 py-8">
          <div className="w-4 h-4 border-2 border-a-gold/30 border-t-a-gold rounded-full animate-spin" />
          <span className="text-a-muted text-xs font-ui">A carregar...</span>
        </div>
      ) : contas.length === 0 ? (
        <div className="py-8 text-center">
          <Landmark size={22} strokeWidth={1} className="text-a-border mx-auto mb-2" />
          <p className="text-xs text-a-muted font-ui">Nenhuma conta bancária registada.</p>
        </div>
      ) : (
        <div className="divide-y divide-a-border border border-a-border rounded-lg overflow-hidden">
          {contas.map(conta => (
            <div key={conta.id} className="p-4">
              {editandoId === conta.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editForm.banco}
                      onChange={e => setEditForm(f => ({ ...f, banco: e.target.value }))}
                      className={inputClass}
                      placeholder="Banco"
                    />
                    <input
                      type="text"
                      value={editForm.titular}
                      onChange={e => setEditForm(f => ({ ...f, titular: e.target.value }))}
                      className={inputClass}
                      placeholder="Titular"
                    />
                  </div>
                  <input
                    type="text"
                    value={editForm.iban}
                    onChange={e => setEditForm(f => ({ ...f, iban: e.target.value }))}
                    className={inputClass + ' font-mono'}
                    placeholder="IBAN"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => guardarEdicao(conta.id)}
                      disabled={aGuardarEdicao}
                      className="flex items-center gap-1.5 bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase px-4 min-h-9 rounded-lg hover:bg-a-charcoal/90 transition-colors disabled:opacity-50 font-ui"
                    >
                      <Check size={12} strokeWidth={1.5} /> Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoId(null)}
                      className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-a-muted hover:text-a-charcoal transition-colors font-ui"
                    >
                      <X size={12} strokeWidth={1.5} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-a-charcoal font-ui">{conta.banco}</p>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-medium font-ui ${
                        conta.ativo
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {conta.ativo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <p className="text-xs text-a-muted font-ui">{conta.titular}</p>
                    <p className="text-[11px] text-a-muted font-mono mt-0.5 truncate">{conta.iban}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => alternarAtivo(conta)}
                      type="button"
                      title={conta.ativo ? 'Desactivar conta' : 'Activar conta'}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        conta.ativo ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          conta.ativo ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => iniciarEdicao(conta)}
                      type="button"
                      title="Editar"
                      className="p-1.5 rounded text-a-muted hover:text-a-gold hover:bg-a-gold/10 transition-colors"
                    >
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => remover(conta.id)}
                      type="button"
                      title="Desactivar"
                      className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
