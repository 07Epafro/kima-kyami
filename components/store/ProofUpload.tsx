'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, Check, AlertTriangle, Clock } from 'lucide-react'

type Estado = 'idle' | 'upload' | 'validando' | 'ok' | 'revisao' | 'problema'

interface Props {
  pagamentoId: string
  onConcluido?: () => void
}

export default function ProofUpload({ pagamentoId, onConcluido }: Props) {
  const [estado, setEstado] = useState<Estado>('idle')
  const [progresso, setProgresso] = useState(0)
  const [ficheiro, setFicheiro] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const TIPOS_ACEITES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  const LIMITE_MB = 10

  function validarFicheiro(f: File): string | null {
    if (!TIPOS_ACEITES.includes(f.type)) return 'Tipo não suportado. Use JPG, PNG ou PDF.'
    if (f.size > LIMITE_MB * 1024 * 1024) return `Ficheiro demasiado grande (máx. ${LIMITE_MB}MB)`
    return null
  }

  const processarFicheiro = useCallback(async (f: File) => {
    const erro = validarFicheiro(f)
    if (erro) { alert(erro); return }

    setFicheiro(f)
    if (f.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(f))
    } else {
      setPreviewUrl(null)
    }

    // Upload
    setEstado('upload')
    setProgresso(0)

    const formData = new FormData()
    formData.append('file', f)
    formData.append('tipo', 'comprovante')
    formData.append('pagamentoId', pagamentoId)

    const uploadUrl = await new Promise<string | null>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgresso(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = async () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText) as { url: string }
          resolve(data.url)
        } else {
          resolve(null)
        }
      }
      xhr.onerror = () => resolve(null)
      xhr.send(formData)
    })

    if (!uploadUrl) {
      setEstado('problema')
      return
    }

    // Save comprovante URL
    const putRes = await fetch(`/api/pagamentos/${pagamentoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comprovante: uploadUrl }),
    })

    if (!putRes.ok) {
      setEstado('problema')
      return
    }

    // Trigger validation (non-blocking)
    setEstado('validando')
    try {
      const valRes = await fetch(`/api/pagamentos/validar/${pagamentoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comprovanteUrl: uploadUrl }),
      })

      if (valRes.ok) {
        const val = (await valRes.json()) as { resultado: { estado: string } }
        const estadoVal = val.resultado?.estado
        if (estadoVal === 'OK') setEstado('ok')
        else if (estadoVal === 'ALERTA') setEstado('revisao')
        else setEstado('revisao')
      } else {
        setEstado('revisao')
      }
    } catch {
      setEstado('revisao')
    }

    onConcluido?.()
  }, [pagamentoId, onConcluido])

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) processarFicheiro(f)
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) processarFicheiro(f)
  }

  function remover() {
    setEstado('idle')
    setFicheiro(null)
    setPreviewUrl(null)
    setProgresso(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Status states ───────────────────────────────────────────────

  if (estado === 'ok') {
    return (
      <div className="flex items-start gap-3 p-5 bg-emerald-50 border border-emerald-200">
        <Check size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-800" style={{ fontFamily: 'var(--font-sans)' }}>
            Comprovante submetido com sucesso
          </p>
          <p className="text-xs text-emerald-700/70 mt-1" style={{ fontFamily: 'var(--font-sans)' }}>
            O teu pagamento está a ser verificado. Receberás um email de confirmação em breve.
          </p>
        </div>
      </div>
    )
  }

  if (estado === 'revisao') {
    return (
      <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-200">
        <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800" style={{ fontFamily: 'var(--font-sans)' }}>
            O teu comprovante está a ser revisto manualmente
          </p>
          <p className="text-xs text-amber-700/70 mt-1" style={{ fontFamily: 'var(--font-sans)' }}>
            Verificaremos o teu pagamento nas próximas 24h. Receberás um email quando for confirmado.
          </p>
        </div>
      </div>
    )
  }

  if (estado === 'problema') {
    return (
      <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200">
        <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800" style={{ fontFamily: 'var(--font-sans)' }}>
            Detectámos um problema com o teu comprovante
          </p>
          <p className="text-xs text-red-700/70 mt-1" style={{ fontFamily: 'var(--font-sans)' }}>
            Por favor contacta-nos em <a href="mailto:geral@kimakyami.ao" className="underline">geral@kimakyami.ao</a>.
          </p>
          <button type="button" onClick={remover} className="text-xs text-red-600 underline mt-2" style={{ fontFamily: 'var(--font-sans)' }}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => estado === 'idle' && inputRef.current?.click()}
        className={`relative border-2 border-dashed transition-all cursor-pointer ${
          drag ? 'border-gold bg-gold/5' : 'border-noir/15 hover:border-noir/40'
        } ${estado !== 'idle' ? 'pointer-events-none' : ''}`}
      >
        <label htmlFor="proof-file" className="sr-only">Seleccionar comprovante de pagamento</label>
        <input
          id="proof-file"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={onInput}
          className="sr-only"
        />

        {estado === 'idle' && !ficheiro && (
          <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
            <Upload size={24} className="text-noir/30" strokeWidth={1.5} />
            <div>
              <p className="text-sm text-noir/70" style={{ fontFamily: 'var(--font-sans)' }}>
                Arrasta o comprovante aqui ou <span className="text-gold underline">selecciona</span>
              </p>
              <p className="text-[10px] text-muted mt-1.5" style={{ fontFamily: 'var(--font-sans)' }}>
                JPG, PNG ou PDF · máx. 10 MB
              </p>
            </div>
          </div>
        )}

        {ficheiro && (
          <div className="flex items-center gap-4 p-4">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="w-16 h-20 object-cover rounded-sm shrink-0" />
            ) : (
              <div className="w-16 h-20 bg-noir/5 flex items-center justify-center shrink-0 rounded-sm">
                <FileText size={24} className="text-noir/30" strokeWidth={1.5} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-noir truncate" style={{ fontFamily: 'var(--font-sans)' }}>
                {ficheiro.name}
              </p>
              <p className="text-[10px] text-muted mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                {(ficheiro.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {estado === 'idle' && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); remover() }}
                aria-label="Remover ficheiro"
                className="text-noir/30 hover:text-gold transition-colors p-1 shrink-0"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload progress */}
      {estado === 'upload' && (
        <div className="space-y-2">
          <div className="h-1 bg-noir/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-200"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-[10px] text-muted text-center" style={{ fontFamily: 'var(--font-sans)' }}>
            A fazer upload… {progresso}%
          </p>
        </div>
      )}

      {/* Validating */}
      {estado === 'validando' && (
        <p className="text-[11px] text-muted text-center animate-pulse" style={{ fontFamily: 'var(--font-sans)' }}>
          A verificar comprovante…
        </p>
      )}
    </div>
  )
}
