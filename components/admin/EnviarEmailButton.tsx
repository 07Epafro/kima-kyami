'use client'

import { useState } from 'react'
import { Mail, X, Send } from 'lucide-react'

interface Props {
  clienteId: string
  clienteEmail: string
}

export default function EnviarEmailButton({ clienteId, clienteEmail }: Props) {
  const [aberto, setAberto] = useState(false)
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar() {
    if (!assunto.trim() || !mensagem.trim()) return
    setErro(null)
    setEnviando(true)

    const res = await fetch(`/api/clientes/${clienteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assunto, mensagem }),
    })

    setEnviando(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setErro(json.error ?? 'Erro ao enviar email')
      return
    }

    setSucesso(true)
    setTimeout(() => {
      setAberto(false)
      setSucesso(false)
      setAssunto('')
      setMensagem('')
    }, 1500)
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded text-sm text-muted hover:text-noir hover:border-gray-300 transition-colors"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <Mail size={14} />
        Enviar email
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xs tracking-widest uppercase text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
                Email para {clienteEmail}
              </h2>
              <button onClick={() => setAberto(false)} className="text-muted hover:text-noir">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-muted mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
                  Assunto
                </label>
                <input
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  placeholder="Assunto do email…"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-muted mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
                  Mensagem
                </label>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold resize-none"
                  placeholder="Escreve a tua mensagem…"
                />
              </div>
              {erro && <p className="text-xs text-red-500">{erro}</p>}
              {sucesso && <p className="text-xs text-emerald-600">Email enviado com sucesso.</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setAberto(false)}
                className="px-4 py-2 text-sm text-muted hover:text-noir"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Cancelar
              </button>
              <button
                onClick={enviar}
                disabled={enviando || !assunto.trim() || !mensagem.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-noir text-cream text-sm rounded hover:bg-noir/90 disabled:opacity-50 transition-colors"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <Send size={13} />
                {enviando ? 'A enviar…' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
