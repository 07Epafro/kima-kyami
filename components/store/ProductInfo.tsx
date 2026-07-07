'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronDown, Check } from 'lucide-react'
import { formatarPreco } from '@/lib/utils'
import SizeSelectionDrawer from './SizeSelectionDrawer'
import type { ProdutoRelacionado } from './SizeSelectionDrawer'
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
  imagens: string[]
  relacionados: ProdutoRelacionado[]
}

const notifSchema = z.object({ email: z.string().email() })
type NotifForm = z.infer<typeof notifSchema>

function stockKey(tamanho: number, cor: string) { return `${tamanho}-${cor}` }

function temStockParaCor(stock: Record<string, number>, tamanhos: number[], cor: string) {
  return tamanhos.some(t => (stock[stockKey(t, cor)] ?? 0) > 0)
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
    conteudo: 'Entregas em Luanda: 2-4 dias úteis. Envios para outras províncias: 4-7 dias úteis. Portes grátis em compras acima de Kz 50.000. Trocas e devoluções aceites em 14 dias após recepção, mediante artigo em perfeito estado.',
  },
]

export default function ProductInfo({
  id, nome, preco, precoAntes, descricao, tamanhos, cores, stock, emBreve, slug, imagem, imagens, relacionados,
}: Props) {
  const [corSel, setCorSel] = useState<CorProduto | null>(cores[0] ?? null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOk, setNotifOk] = useState(false)
  const [acordeaoAberto, setAcordeaoAberto] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NotifForm>({
    resolver: zodResolver(notifSchema),
  })

  const corTemStock = corSel ? temStockParaCor(stock, tamanhos, corSel.nome) : false
  const algumStockDisponivel = tamanhos.some(t =>
    cores.some(c => (stock[stockKey(t, c.nome)] ?? 0) > 0)
  )

  async function onNotif(data: NotifForm) {
    await fetch('/api/notificacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, produtoId: id }),
    })
    setNotifOk(true)
  }

  return (
    <>
      <div className="space-y-7">
        {/* Nome e preço */}
        <div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-light text-noir leading-snug tracking-[0.06em] mb-3 font-serif">
            {nome}
          </h1>
          <div className="flex items-baseline gap-3">
            {precoAntes && (
              <span className="text-sm text-muted line-through font-sans">
                {formatarPreco(precoAntes)}
              </span>
            )}
            <span className={`text-xl font-light font-serif ${precoAntes ? 'text-gold' : 'text-noir'}`}>
              {formatarPreco(preco)}
            </span>
          </div>
        </div>

        {/* Descrição */}
        <p className="text-sm text-noir/65 leading-[1.85] tracking-wide font-sans">
          {descricao}
        </p>

        {emBreve ? (
          /* Em breve — notificação */
          <div className="space-y-4 py-4 border-t border-b border-noir/8">
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted font-sans">
              Avisa-me quando disponível
            </p>
            {notifOk ? (
              <p className="text-sm text-emerald-700 flex items-center gap-2 font-sans">
                <Check size={14} /> Avisaremos quando estiver disponível.
              </p>
            ) : (
              <form onSubmit={handleSubmit(onNotif)} className="flex gap-2">
                <input
                  {...register('email')}
                  type="email"
                  placeholder="O teu email"
                  className="flex-1 border border-noir/20 px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-gold text-noir placeholder:text-muted/60 font-sans"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 min-h-12 bg-noir text-cream text-[10px] tracking-[0.2em] uppercase hover:bg-noir/85 disabled:opacity-50 transition-colors whitespace-nowrap font-sans"
                >
                  NOTIFICAR
                </button>
              </form>
            )}
            {errors.email && (
              <p className="text-xs text-red-500 font-sans">{errors.email.message}</p>
            )}
          </div>
        ) : (
          <>
            {/* Selector de cor */}
            {cores.length > 0 && (
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-muted mb-3 font-sans">
                  Cor: <span className="text-noir">{corSel?.nome}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {cores.map(cor => (
                    <button
                      key={cor.nome}
                      type="button"
                      onClick={() => setCorSel(cor)}
                      aria-label={`Cor: ${cor.nome}`}
                      title={cor.nome}
                      className={`w-8 h-8 rounded-full transition-all [background:var(--swatch)] ${
                        corSel?.nome === cor.nome
                          ? 'ring-2 ring-gold ring-offset-2'
                          : 'ring-1 ring-noir/20 hover:ring-noir/50'
                      }`}
                      style={{ '--swatch': cor.hex } as React.CSSProperties}
                    />
                  ))}
                </div>
                {corSel && !corTemStock && (
                  <p className="mt-2 text-[11px] text-amber-700 font-sans">
                    Esgotado nesta cor
                  </p>
                )}
              </div>
            )}

            {/* CTA principal — h-14 = 56px */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              disabled={!algumStockDisponivel || (!!corSel && !corTemStock)}
              className={`w-full h-14 text-[11px] tracking-[0.3em] uppercase transition-all duration-200 font-sans ${
                algumStockDisponivel && !(corSel && !corTemStock)
                  ? 'bg-noir text-cream hover:bg-noir/85'
                  : 'bg-noir/15 text-noir/35 cursor-not-allowed'
              }`}
            >
              {algumStockDisponivel && !(corSel && !corTemStock) ? 'ADICIONAR' : 'ESGOTADO'}
            </button>
          </>
        )}

        {/* Acordeão */}
        <div className="border-t border-noir/8 divide-y divide-noir/8">
          {ACORDEAO.map(({ titulo, conteudo }) => (
            <div key={titulo}>
              <button
                type="button"
                onClick={() => setAcordeaoAberto(a => a === titulo ? null : titulo)}
                className="flex items-center justify-between w-full py-4 text-left"
              >
                <span className="text-[11px] tracking-[0.2em] uppercase text-noir font-sans">
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
                <p className="text-sm text-noir/60 leading-[1.85] pb-5 font-sans">
                  {conteudo}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Drawer de seleção de tamanho */}
      <SizeSelectionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        produto={{ id, nome, preco, imagens, slug }}
        corSel={corSel}
        tamanhos={tamanhos}
        stock={stock}
        relacionados={relacionados}
      />
    </>
  )
}
