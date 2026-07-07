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
import { formatarPreco } from '@/lib/utils'

const PORTES_GRATIS_A_PARTIR_DE = 50000
const CUSTO_PORTES = 3500

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

const inputCls = 'w-full border border-noir/20 px-4 py-3 text-sm bg-cream text-noir placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors font-sans'
const labelCls = 'block text-[9.5px] tracking-[0.25em] uppercase text-muted mb-1.5 font-sans'

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
  const portes = subtotal >= PORTES_GRATIS_A_PARTIR_DE ? 0 : CUSTO_PORTES
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
      <div className="max-w-lg mx-auto px-6 py-20 text-center font-sans">
        <p className="text-sm text-muted mb-6">
          O teu carrinho está vazio.
        </p>
        <Link
          href="/colecoes"
          className="inline-block text-[10px] tracking-[0.25em] uppercase border border-noir text-noir px-8 py-3 hover:bg-noir hover:text-cream transition-colors"
        >
          DESCOBRIR COLEÇÃO
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-300 mx-auto px-5 sm:px-8 py-10 font-sans">
      {/* Back */}
      <Link
        href="/colecoes"
        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-muted hover:text-noir transition-colors mb-8"
      >
        <ChevronLeft size={12} /> CONTINUAR A COMPRAR
      </Link>

      <h1 className="text-2xl font-light text-noir tracking-[0.12em] uppercase mb-10 font-serif">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-12">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Contacto */}
          <section>
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-muted mb-5 pb-3 border-b border-noir/8">
              Dados de Contacto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Nome completo *</label>
                <input {...register('nome')} className={inputCls} placeholder="Ana Sofia Luvualu" />
                {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input {...register('email')} type="email" className={inputCls} placeholder="ana@exemplo.ao" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Telefone</label>
                <input {...register('telefone')} className={inputCls} placeholder="+244 9XX XXX XXX" />
              </div>
            </div>
          </section>

          {/* Morada */}
          <section>
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-muted mb-5 pb-3 border-b border-noir/8">
              Morada de Envio
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Rua / Avenida *</label>
                <input {...register('moradaRua')} className={inputCls} placeholder="Rua Rainha Ginga" />
                {errors.moradaRua && <p className="text-xs text-red-500 mt-1">{errors.moradaRua.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Nº / Andar</label>
                <input {...register('moradaNumero')} className={inputCls} placeholder="12, 3º Dto" />
              </div>
              <div>
                <label className={labelCls}>Código Postal *</label>
                <input {...register('moradaCp')} className={inputCls} placeholder="11000" />
                {errors.moradaCp && <p className="text-xs text-red-500 mt-1">{errors.moradaCp.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Cidade *</label>
                <input {...register('moradaCidade')} className={inputCls} placeholder="Luanda" />
                {errors.moradaCidade && <p className="text-xs text-red-500 mt-1">{errors.moradaCidade.message}</p>}
              </div>
              <div>
                <label className={labelCls}>País *</label>
                <select {...register('moradaPais')} className={inputCls + ' appearance-none cursor-pointer'}>
                  {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </section>

          {avisoStock && (
            <p className="text-sm text-amber-700 bg-amber-50 px-4 py-3 border border-amber-200">
              {avisoStock}
            </p>
          )}

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 border border-red-200">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-14 py-4 bg-noir text-cream text-[11px] tracking-[0.3em] uppercase hover:bg-noir/85 disabled:opacity-50 transition-colors font-sans"
          >
            {isSubmitting ? 'A processar…' : 'CONTINUAR PARA PAGAMENTO'}
          </button>
        </form>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-noir/10 p-6 space-y-5 bg-white">
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-muted">
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
                    <span className="absolute -top-1.5 -right-1.5 bg-noir text-cream text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                      {item.quantidade}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-light text-noir leading-snug font-serif">
                      {item.nome}
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">
                      {item.cor} · Nº {item.tamanho}
                    </p>
                  </div>
                  <p className="text-xs text-noir shrink-0">
                    {formatarPreco(item.preco * item.quantidade)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="border-t border-noir/8 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>Subtotal</span>
                <span>{formatarPreco(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Portes</span>
                <span>{portes === 0 ? 'Grátis' : formatarPreco(portes)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-noir pt-2 border-t border-noir/8">
                <span>Total</span>
                <span className="text-base font-serif">{formatarPreco(totalFinal)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
