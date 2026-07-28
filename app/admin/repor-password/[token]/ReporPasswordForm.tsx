'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'

const schema = z
  .object({
    password: z.string().min(6, 'A password deve ter pelo menos 6 caracteres'),
    confirmar: z.string(),
  })
  .refine((data) => data.password === data.confirmar, {
    message: 'As passwords não coincidem',
    path: ['confirmar'],
  })

type FormData = z.infer<typeof schema>

export default function ReporPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/repor-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setErrorMsg(typeof json.error === 'string' ? json.error : 'Erro ao repor a password')
        return
      }
      router.push('/admin/login')
    } catch {
      setErrorMsg('Erro de rede. Tenta novamente.')
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-8">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="block text-xs tracking-widest uppercase text-muted mb-2"
          >
            Nova password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              className="w-full bg-transparent border border-white/20 rounded px-4 py-3 pr-11 text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmar"
            className="block text-xs tracking-widest uppercase text-muted mb-2"
          >
            Confirmar password
          </label>
          <input
            id="confirmar"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmar')}
            className="w-full bg-transparent border border-white/20 rounded px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold"
          />
          {errors.confirmar && (
            <p className="mt-1 text-xs text-red-400">{errors.confirmar.message}</p>
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
          {isSubmitting ? 'A guardar…' : 'Definir password'}
        </button>

        <Link
          href="/admin/login"
          className="block text-center text-xs tracking-widest uppercase text-muted hover:text-white"
        >
          Voltar ao login
        </Link>
      </form>
    </div>
  )
}
