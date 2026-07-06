'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useCart } from '@/context/CartContext'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  moradaRua: z.string().min(1, 'Rua obrigatória'),
  moradaNumero: z.string().optional(),
  moradaCidade: z.string().min(1, 'Cidade obrigatória'),
  moradaCp: z.string().min(3, 'Código postal obrigatório'),
  moradaPais: z.string().min(1, 'País obrigatório'),
})

type FormValues = z.infer<typeof schema>

const PAISES = ['Angola', 'Portugal', 'Espanha', 'França', 'Alemanha', 'Reino Unido', 'Outro']

function formatarPreco(v: number) { return `Kz ${v.toFixed(2).replace('.', ',')}` }

const inputCls = 'w-full border border-noir/20 px-4 py-3 text-sm bg-cream text-noir placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors'
const labelCls = 'block text-[9.5px] tracking-[0.25em] uppercase text-muted mb-1.5'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, count } = useCart()
  const [erro, setErro] = useState<string | null>(null)
  const [avisoStock, setAvisoStock] = useState<string | null>(null)
  const submitted = useRef(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { moradaPais: 'Angola' },
  })

  useEffect(() => {
    if (items.length === 0) return
    const ids = [...new Set(items.map(i => i.produtoId))]
    Promise.all(ids.map(id => fetch(`/api/produtos/${id}`).then(r => r.json()))).then(prods => {
      for (const item of items) {
        const prod = prods.find((p: { id: string; stock: Record<string, number> }) => p.id === item.produtoId)
        if (!prod) continue
        const key = `${item.tamanho}-${item.cor}`
        const disponivel = (prod.stock as Record<string, number>)[key] ?? 0
        if (disponivel < item.quantidade) {
          setAvisoStock(`Stock insuficiente para ${item.nome} (${item.cor}, nº${item.tamanho}). Disponível: ${disponivel}.`)
          return
        }
      }
    }).catch(() => { /* stock check falhou — validação ocorre no servidor */ })
  }, [items])

  const subtotal = total
  const portes = subtotal >= 150 ? 0 : 5.99
  const totalFinal = subtotal + portes

  async function onSubmit(data: FormValues) {
    if (submitted.current) return
    setErro(null)

    const res = await fetch('/api/encomendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        itens: items.map(i => ({
          produtoId: i.produtoId,
          tamanho: i.tamanho,
          cor: i.cor,
          quantidade: i.quantidade,
        })),
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      const msg = typeof json.error === 'string' ? json.error : 'Erro ao criar encomenda'
      setErro(msg)
      return
    }

    const json = (await res.json()) as {
      encomendaId: string
      pagamentoId: string
      referencia: string
      iban: string
      titular: string
      valor: number
    }

    submitted.current = true
    sessionStorage.setItem('kk-checkout', JSON.stringify({ ...json, email: data.email }))
    router.push('/checkout/pagamento')
  }

  if (count === 0) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-sm text-muted mb-6" style={{ fontFamily: 'var(--font-sans)' }}>
          O teu carrinho está vazio.
        </p>
        <Link
          href="/colecoes"
          className="inline-block text-[10px] tracking-[0.25em] uppercase border border-noir text-noir px-8 py-3 hover:bg-noir hover:text-cream transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          DESCOBRIR COLEÇÃO
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-10">
      {/* Back */}
      <Link
        href="/colecoes"
        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-muted hover:text-noir transition-colors mb-8"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <ChevronLeft size={12} /> CONTINUAR A COMPRAR
      </Link>

      <h1
        className="text-2xl font-light text-noir tracking-[0.12em] uppercase mb-10"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-12">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Contacto */}
          <section>
            <h2
              className="text-[10px] tracking-[0.3em] uppercase text-muted mb-5 pb-3 border-b border-noir/8"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Dados de Contacto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls} style={{ fontFamily: 'var(--font-sans)' }}>Nome completo *</label>
                <input {...register('nome')} className={inputCls} placeholder="Ana Sofia Ferreira" style={{ fontFamily: 'var(--font-sans)' }} />
                {errors.nome && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'var(--font-sans)' }}>{errors.nome.message}</p>}
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: 'var(--font-sans)' }}>Email *</label>
                <input {...register('email')} type="email" className={inputCls} placeholder="ana@exemplo.pt" style={{ fontFamily: 'var(--font-sans)' }} />
                {errors.email && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'var(--font-sans)' }}>{errors.email.message}</p>}
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: 'var(--font-sans)' }}>Telefone</label>
                <input {...register('telefone')} className={inputCls} placeholder="+351 9XX XXX XXX" style={{ fontFamily: 'var(--font-sans)' }} />
              </div>
            </div>
          </section>

          {/* Morada */}
          <section>
            <h2
              className="text-[10px] tracking-[0.3em] uppercase text-muted mb-5 pb-3 border-b border-noir/8"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Morada de Envio
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls} style={{ fontFamily: 'var(--font-sans)' }}>Rua / Avenida *</label>
                <input {...register('moradaRua')} className={inputCls} placeholder="Rua das Flores" style={{ fontFamily: 'var(--font-sans)' }} />
                {errors.moradaRua && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'var(--font-sans)' }}>{errors.moradaRua.message}</p>}
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: 'var(--font-sans)' }}>Nº / Andar</label>
                <input {...register('moradaNumero')} className={inputCls} placeholder="12, 3º Dto" style={{ fontFamily: 'var(--font-sans)' }} />
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: 'var(--font-sans)' }}>Código Postal *</label>
                <input {...register('moradaCp')} className={inputCls} placeholder="1200-001" style={{ fontFamily: 'var(--font-sans)' }} />
                {errors.moradaCp && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'var(--font-sans)' }}>{errors.moradaCp.message}</p>}
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: 'var(--font-sans)' }}>Cidade *</label>
                <input {...register('moradaCidade')} className={inputCls} placeholder="Lisboa" style={{ fontFamily: 'var(--font-sans)' }} />
                {errors.moradaCidade && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'var(--font-sans)' }}>{errors.moradaCidade.message}</p>}
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: 'var(--font-sans)' }}>País *</label>
                <select {...register('moradaPais')} className={inputCls + ' appearance-none cursor-pointer'} style={{ fontFamily: 'var(--font-sans)' }}>
                  {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </section>

          {avisoStock && (
            <p className="text-sm text-amber-700 bg-amber-50 px-4 py-3 border border-amber-200" style={{ fontFamily: 'var(--font-sans)' }}>
              {avisoStock}
            </p>
          )}

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 border border-red-200" style={{ fontFamily: 'var(--font-sans)' }}>
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-noir text-cream text-[11px] tracking-[0.3em] uppercase hover:bg-noir/85 disabled:opacity-50 transition-colors"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {isSubmitting ? 'A processar…' : 'CONTINUAR PARA PAGAMENTO'}
          </button>
        </form>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-noir/10 p-6 space-y-5 bg-white">
            <h2
              className="text-[10px] tracking-[0.3em] uppercase text-muted"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Resumo do Pedido
            </h2>

            <ul className="space-y-4">
              {items.map(item => (
                <li
                  key={`${item.produtoId}-${item.tamanho}-${item.cor}`}
                  className="flex gap-3"
                >
                  <div className="relative w-14 h-16 shrink-0 bg-noir/5">
                    {item.imagem && (
                      <Image
                        src={item.imagem}
                        alt={item.nome}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                    <span
                      className="absolute -top-1.5 -right-1.5 bg-noir text-cream text-[9px] w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      {item.quantidade}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-light text-noir leading-snug"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {item.nome}
                    </p>
                    <p
                      className="text-[10px] text-muted mt-0.5"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      {item.cor} · Nº {item.tamanho}
                    </p>
                  </div>
                  <p
                    className="text-xs text-noir shrink-0"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {formatarPreco(item.preco * item.quantidade)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="border-t border-noir/8 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
                <span>Subtotal</span>
                <span>{formatarPreco(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
                <span>Portes</span>
                <span>{portes === 0 ? 'Grátis' : formatarPreco(portes)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-noir pt-2 border-t border-noir/8" style={{ fontFamily: 'var(--font-sans)' }}>
                <span>Total</span>
                <span className="text-base" style={{ fontFamily: 'var(--font-serif)' }}>{formatarPreco(totalFinal)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
