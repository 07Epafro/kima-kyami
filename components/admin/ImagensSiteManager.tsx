'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Upload, RotateCcw } from 'lucide-react'

interface ImagemSiteRow {
  chave: string
  descricao: string
  grupo: 'Home' | 'A Marca' | 'Lookbook'
  url: string
  personalizada: boolean
}

export default function ImagensSiteManager() {
  const [imagens, setImagens] = useState<ImagemSiteRow[]>([])
  const [estado, setEstado] = useState<'loading' | 'idle' | 'error'>('loading')
  const [aEnviar, setAEnviar] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function carregar() {
    setEstado('loading')
    fetch('/api/imagens-site')
      .then(r => {
        if (!r.ok) throw new Error('request failed')
        return r.json()
      })
      .then((data: { imagens: ImagemSiteRow[] }) => {
        setImagens(data.imagens ?? [])
        setEstado('idle')
      })
      .catch(() => setEstado('error'))
  }

  useEffect(() => { carregar() }, [])

  async function substituir(chave: string, file: File) {
    setErro(null)
    setAEnviar(chave)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo', 'site')
      const resUpload = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!resUpload.ok) {
        const json = (await resUpload.json().catch(() => ({}))) as { error?: string }
        setErro(json.error ?? 'Erro no upload')
        return
      }
      const { url } = (await resUpload.json()) as { url: string }

      const resPatch = await fetch('/api/imagens-site', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave, url }),
      })
      if (!resPatch.ok) {
        const json = (await resPatch.json().catch(() => ({}))) as { error?: string }
        setErro(typeof json.error === 'string' ? json.error : 'Erro ao guardar a nova imagem')
        return
      }
      carregar()
    } catch {
      setErro('Erro de rede ao processar a imagem')
    } finally {
      setAEnviar(null)
      const input = inputRefs.current[chave]
      if (input) input.value = ''
    }
  }

  async function repor(chave: string) {
    if (!confirm('Repor a imagem original desta secção?')) return
    setErro(null)
    setAEnviar(chave)
    try {
      const res = await fetch(`/api/imagens-site?chave=${encodeURIComponent(chave)}`, { method: 'DELETE' })
      if (!res.ok) {
        setErro('Erro ao repor imagem')
        return
      }
      carregar()
    } finally {
      setAEnviar(null)
    }
  }

  if (estado === 'loading') {
    return (
      <div className="flex items-center gap-3 py-12">
        <div className="w-5 h-5 border-2 border-a-gold/30 border-t-a-gold rounded-full animate-spin" />
        <span className="text-a-muted text-sm font-ui">A carregar...</span>
      </div>
    )
  }

  if (estado === 'error') {
    return <p className="text-sm text-red-500 font-ui py-6">Erro ao carregar imagens do site.</p>
  }

  const grupos: ImagemSiteRow['grupo'][] = ['Home', 'A Marca', 'Lookbook']

  return (
    <div className="space-y-8">
      {erro && (
        <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg font-ui">{erro}</p>
      )}

      {grupos.map(grupo => {
        const itens = imagens.filter(i => i.grupo === grupo)
        if (itens.length === 0) return null

        return (
          <section key={grupo} className="space-y-4">
            <p className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted pb-3 border-b border-a-border font-ui">
              {grupo}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {itens.map(item => (
                <div key={item.chave} className="bg-white border border-a-border rounded-lg overflow-hidden">
                  <div className="relative aspect-4/3 bg-a-bone">
                    <Image
                      src={item.url}
                      alt={item.descricao}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                    {aEnviar === item.chave && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-a-charcoal font-ui truncate">{item.descricao}</p>
                      {item.personalizada && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-a-gold/10 text-a-gold border border-a-gold/30 font-ui shrink-0">
                          Personalizada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-a-charcoal border border-a-border rounded-lg px-3 min-h-9 cursor-pointer hover:border-a-gold hover:text-a-gold transition-colors font-ui">
                        <Upload size={12} strokeWidth={1.5} />
                        Substituir
                        <input
                          ref={el => { inputRefs.current[item.chave] = el }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={aEnviar !== null}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) substituir(item.chave, file)
                          }}
                        />
                      </label>
                      {item.personalizada && (
                        <button
                          type="button"
                          onClick={() => repor(item.chave)}
                          disabled={aEnviar !== null}
                          title="Repor imagem original"
                          className="p-2 rounded-lg text-a-muted hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <RotateCcw size={14} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
