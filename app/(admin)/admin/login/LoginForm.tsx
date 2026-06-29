'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter pelo menos 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function LoginForm() {
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
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setErrorMsg('Credenciais inválidas')
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-8">
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

        <div>
          <label
            htmlFor="password"
            className="block text-xs tracking-widest uppercase text-muted mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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

        {errorMsg && (
          <p className="text-xs text-red-400 text-center">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gold text-noir text-sm font-medium tracking-widest uppercase py-3 rounded hover:bg-gold/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
