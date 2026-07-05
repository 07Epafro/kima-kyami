'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronDown, Check } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import type { CorProduto } from '@/types'

interface Props {
  id: string
  nome: string
  preco: number
  precoAntes?: number | null
  descricao: string
  tamanhos: number[]
  cores: CorProduto[]
  stock: Record<string, number>
  emBreve: boolean
  slug: string
  imagem: string
}

const notifSchema = z.object({ email: z.string().email() })
type NotifForm = z.infer<typeof notifSchema>

function formatarPreco(valor: number) {
  return `€ ${valor.toFixed(2).replace('.', ',')}`
}

function stockKey(tamanho: number, cor: string) {
  return `${tamanho}-${cor}`
}

function getStockParaCor(
  stock: Record<string, number>,
  tamanhos: number[],
  cor: string,
) {
  return tamanhos.filter(t => (stock[stockKey(t, cor)] ?? 0) > 0)
}

const ACORDEAO = [
  {
    titulo: 'Detalhes',
    conteudo: 'Cada par é artesanalmente acabado com materiais premium seleccionados. Os detalhes fazem toda a diferença — desde o forro interior à sola, cada elemento foi pensado para durar.',
  },
  {
    titulo: 'Guia de Tamanhos',
    conteudo: 'Os nossos sapatos têm um ajuste standard. Recomendamos o teu tamanho habitual. Se estiveres entre dois tamanhos, sugere-se o maior. Consulta a nossa tabela completa na página de ajuda.',
  },
  {
    titulo: 'Envios e Devoluções',
    conteudo: 'Envios para Portugal Continental: 3-5 dias úteis. Portes grátis em compras acima de €150. Trocas e devoluções aceites em 14 dias após recepção, mediante artigo em perfeito estado.',
  },
]

export default function ProductInfo({
  id, nome, preco, precoAntes, descricao, tamanhos, cores, stock, emBreve, slug, imagem,
}: Props) {
  const { addItem, openCart } = useCart()

  const [corSel, setCorSel] = useState<CorProduto | null>(cores[0] ?? null)
  const [tamSel, setTamSel] = useState<number | null>(null)
  const [adicionado, setAdicionado] = useState(false)
  const [acordeaoAberto, setAcordeaoAberto] = useState<string | null>(null)
  const [notifOk, setNotifOk] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NotifForm>({
    resolver: zodResolver(notifSchema),
  })

  const tamanhosDisponiveis = corSel
    ? getStockParaCor(stock, tamanhos, corSel.nome)
    : []

  function stockActual() {
    if (!corSel || !tamSel) return 0
    return stock[stockKey(tamSel, corSel.nome)] ?? 0
  }

  function handleAdicionarCarrinho() {
    if (!corSel || !tamSel) return
    addItem({
      produtoId: id,
      slug,
      nome,
      imagem,
      preco,
      tamanho: tamSel,
      cor: corSel.nome,
    })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  async function onNotif(data: NotifForm) {
    await fetch('/api/notificacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, produtoId: id }),
    })
    setNotifOk(true)
  }

  const qtdActual = stockActual()
  const baixoStock = qtdActual > 0 && qtdActual <= 3

  return (
    <div className="space-y-7">
      {/* Nome e preço */}
      <div>
        <h1
          className="text-[clamp(24px,3vw,36px)] font-light text-noir leading-snug tracking-[0.06em] mb-3"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {nome}
        </h1>
        <div className="flex items-baseline gap-3">
          {precoAntes && (
            <span
              className="text-sm text-muted line-through"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {formatarPreco(precoAntes)}
            </span>
          )}
          <span
            className={`text-xl font-light ${precoAntes ? 'text-gold' : 'text-noir'}`}
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {formatarPreco(preco)}
          </span>
        </div>
      </div>

      {/* Descrição */}
      <p
        className="text-sm text-noir/65 leading-[1.85] tracking-wide"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {descricao}
      </p>

      {emBreve ? (
        /* Em breve — notificação */
        <div className="space-y-4 py-4 border-t border-b border-noir/8">
          <p
            className="text-[10px] tracking-[0.25em] uppercase text-muted"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Avisa-me quando disponível
          </p>
          {notifOk ? (
            <p
              className="text-sm text-emerald-700 flex items-center gap-2"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <Check size={14} /> Avisaremos quando estiver disponível.
            </p>
          ) : (
            <form onSubmit={handleSubmit(onNotif)} className="flex gap-2">
              <input
                {...register('email')}
                type="email"
                placeholder="O teu email"
                className="flex-1 border border-noir/20 px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-gold text-noir placeholder:text-muted/60"
                style={{ fontFamily: 'var(--font-sans)' }}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-noir text-cream text-[10px] tracking-[0.2em] uppercase hover:bg-noir/85 disabled:opacity-50 transition-colors whitespace-nowrap"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                NOTIFICAR
              </button>
            </form>
          )}
          {errors.email && (
            <p className="text-xs text-red-500" style={{ fontFamily: 'var(--font-sans)' }}>
              {errors.email.message}
            </p>
          )}
        </div>
      ) : (
        /* Selector de cor + tamanho + CTA */
        <>
          {/* Selector de cor */}
          {cores.length > 0 && (
            <div>
              <p
                className="text-[10px] tracking-[0.25em] uppercase text-muted mb-3"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Cor: <span className="text-noir">{corSel?.nome}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {cores.map(cor => (
                  <button
                    key={cor.nome}
                    onClick={() => { setCorSel(cor); setTamSel(null) }}
                    aria-label={`Cor: ${cor.nome}`}
                    title={cor.nome}
                    className={`w-8 h-8 rounded-full transition-all ${
                      corSel?.nome === cor.nome
                        ? 'ring-2 ring-gold ring-offset-2'
                        : 'ring-1 ring-noir/20 hover:ring-noir/50'
                    }`}
                    style={{ backgroundColor: cor.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selector de tamanho */}
          <div>
            <p
              className="text-[10px] tracking-[0.25em] uppercase text-muted mb-3"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Tamanho {tamSel && `— ${tamSel}`}
            </p>
            <div className="flex flex-wrap gap-2">
              {tamanhos.map(tam => {
                const disponivel = !corSel || tamanhosDisponiveis.includes(tam)
                const selecionado = tamSel === tam
                return (
                  <button
                    key={tam}
                    onClick={() => disponivel && setTamSel(tam)}
                    disabled={!disponivel}
                    className={`w-11 h-11 text-[11px] border transition-all ${
                      selecionado
                        ? 'bg-noir text-cream border-noir'
                        : disponivel
                        ? 'border-noir/25 text-noir hover:border-noir'
                        : 'border-noir/10 text-noir/25 cursor-not-allowed line-through'
                    }`}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {tam}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Aviso de stock baixo */}
          {baixoStock && (
            <p
              className="text-[11px] text-amber-700 tracking-wide"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Últimas {qtdActual} unidade{qtdActual > 1 ? 's' : ''}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={handleAdicionarCarrinho}
            disabled={!corSel || !tamSel || adicionado}
            className={`w-full py-4 text-[11px] tracking-[0.3em] uppercase transition-all duration-300 ${
              adicionado
                ? 'bg-emerald-700 text-cream'
                : corSel && tamSel
                ? 'bg-noir text-cream hover:bg-noir/85'
                : 'bg-noir/20 text-noir/40 cursor-not-allowed'
            }`}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {adicionado ? '✓ ADICIONADO AO CARRINHO' : 'ADICIONAR AO CARRINHO'}
          </button>
        </>
      )}

      {/* Acordeão */}
      <div className="border-t border-noir/8 divide-y divide-noir/8">
        {ACORDEAO.map(({ titulo, conteudo }) => (
          <div key={titulo}>
            <button
              onClick={() => setAcordeaoAberto(a => a === titulo ? null : titulo)}
              className="flex items-center justify-between w-full py-4 text-left"
            >
              <span
                className="text-[11px] tracking-[0.2em] uppercase text-noir"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {titulo}
              </span>
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                className={`text-noir/40 transition-transform duration-200 ${
                  acordeaoAberto === titulo ? 'rotate-180' : ''
                }`}
              />
            </button>
            {acordeaoAberto === titulo && (
              <p
                className="text-sm text-noir/60 leading-[1.85] pb-5"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {conteudo}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
