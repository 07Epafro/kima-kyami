'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

export default function EsqueciPasswordForm() {
  const [enviado, setEnviado] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/esqueci-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setErrorMsg(typeof json.error === 'string' ? json.error : 'Erro ao processar o pedido')
        return
      }
      setEnviado(true)
    } catch {
      setErrorMsg('Erro de rede. Tenta novamente.')
    }
  }

  if (enviado) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
        <p className="text-sm text-white leading-relaxed">
          Se esse email existir, foi enviado um link para repores a password. Verifica a tua caixa de entrada.
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-gold hover:text-gold/80"
        >
          <ArrowLeft size={13} /> Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-8">
      <p className="text-xs text-muted mb-6 leading-relaxed">
        Introduz o teu email de administrador. Vais receber um link para definires uma nova password.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-xs tracking-widest uppercase text-muted mb-2"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full bg-transparent border border-white/20 rounded px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold"
            placeholder="admin@kimakyami.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 text-center">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gold text-noir text-sm font-medium tracking-widest uppercase py-3 rounded hover:bg-gold/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'A enviar…' : 'Enviar link'}
        </button>

        <Link
          href="/admin/login"
          className="flex items-center justify-center gap-1.5 text-xs tracking-widest uppercase text-muted hover:text-white"
        >
          <ArrowLeft size={13} /> Voltar ao login
        </Link>
      </form>
    </div>
  )
}
