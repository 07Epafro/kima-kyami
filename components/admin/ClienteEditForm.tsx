'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Edit2, Check, X } from 'lucide-react'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().nullable().optional(),
  moradaRua: z.string().optional(),
  moradaCp: z.string().optional(),
  moradaCidade: z.string().optional(),
  moradaPais: z.string().optional(),
  notas: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof schema>

interface Morada {
  rua?: string
  codigoPostal?: string
  cidade?: string
  pais?: string
}

interface Props {
  clienteId: string
  nome: string
  email: string
  telefone?: string | null
  morada?: Morada | null
  notas?: string | null
}

const inputCls = 'w-full border border-gray-200 rounded px-3 py-2 text-sm text-noir focus:outline-none focus:border-gold'
const labelCls = 'block text-[10px] tracking-widest uppercase text-muted mb-1'

export default function ClienteEditForm({ clienteId, nome, email, telefone, morada, notas }: Props) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome,
      email,
      telefone: telefone ?? '',
      moradaRua: morada?.rua ?? '',
      moradaCp: morada?.codigoPostal ?? '',
      moradaCidade: morada?.cidade ?? '',
      moradaPais: morada?.pais ?? 'Portugal',
      notas: notas ?? '',
    },
  })

  async function onSubmit(data: FormValues) {
    setErro(null)
    const moradaObj = data.moradaRua
      ? { rua: data.moradaRua, codigoPostal: data.moradaCp ?? '', cidade: data.moradaCidade ?? '', pais: data.moradaPais ?? 'Portugal' }
      : null

    const res = await fetch(`/api/clientes/${clienteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: data.nome,
        email: data.email,
        telefone: data.telefone || null,
        morada: moradaObj,
        notas: data.notas || null,
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setErro(json.error ?? 'Erro ao guardar')
      return
    }

    setEditando(false)
    router.refresh()
  }

  function cancelar() {
    reset()
    setErro(null)
    setEditando(false)
  }

  if (!editando) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs tracking-widest uppercase text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            Dados de contacto
          </h3>
          <button
            onClick={() => setEditando(true)}
            className="flex items-center gap-1.5 text-xs text-gold hover:underline"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            <Edit2 size={12} /> Editar
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
          <div>
            <p className={cn(labelCls, 'mb-0.5')}>Nome</p>
            <p className="text-noir">{nome}</p>
          </div>
          <div>
            <p className={cn(labelCls, 'mb-0.5')}>Email</p>
            <p className="text-noir">{email}</p>
          </div>
          {telefone && (
            <div>
              <p className={cn(labelCls, 'mb-0.5')}>Telefone</p>
              <p className="text-noir">{telefone}</p>
            </div>
          )}
          {morada && (
            <div className="sm:col-span-2">
              <p className={cn(labelCls, 'mb-0.5')}>Morada</p>
              <address className="not-italic text-noir leading-relaxed">
                {morada.rua}<br />
                {morada.codigoPostal} {morada.cidade} · {morada.pais}
              </address>
            </div>
          )}
          {notas && (
            <div className="sm:col-span-2">
              <p className={cn(labelCls, 'mb-0.5')}>Notas</p>
              <p className="text-muted text-xs whitespace-pre-wrap">{notas}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs tracking-widest uppercase text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
          Editar dados
        </h3>
        <div className="flex gap-2">
          <button type="submit" disabled={isSubmitting}
            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
            <Check size={13} /> Guardar
          </button>
          <button type="button" onClick={cancelar}
            className="flex items-center gap-1 text-xs text-muted hover:text-noir">
            <X size={13} /> Cancelar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nome</label>
          <input {...register('nome')} className={inputCls} />
          {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input {...register('email')} type="email" className={inputCls} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Telefone</label>
          <input {...register('telefone')} className={inputCls} placeholder="+351 9XX XXX XXX" />
        </div>
        <div />
        <div className="sm:col-span-2">
          <p className="text-[10px] tracking-widest uppercase text-muted mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
            Morada
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input {...register('moradaRua')} className={inputCls} placeholder="Rua" />
            <input {...register('moradaCp')} className={inputCls} placeholder="Código Postal" />
            <input {...register('moradaCidade')} className={inputCls} placeholder="Cidade" />
            <input {...register('moradaPais')} className={inputCls} placeholder="País" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Notas internas</label>
          <textarea {...register('notas')} rows={3} className={cn(inputCls, 'resize-none')} placeholder="Visível apenas no painel…" />
        </div>
      </div>

      {erro && <p className="text-xs text-red-500">{erro}</p>}
    </form>
  )
}
