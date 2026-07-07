'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { slugify, cn } from '@/lib/utils'
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, RefreshCw, Upload } from 'lucide-react'

// ─── Schema ──────────────────────────────────────────────────────────────────

const CATEGORIAS = ['SALTOS', 'SANDALIAS', 'MULES', 'COLECAO_LIMITADA'] as const
const TAMANHOS_DISPONIVEIS = [35, 36, 37, 38, 39, 40, 41] as const

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  preco: z.number({ invalid_type_error: 'Preço obrigatório' }).positive('Preço deve ser positivo'),
  precoAntes: z.preprocess(
    (v) => (typeof v === 'number' && isNaN(v) ? undefined : v),
    z.number().positive().optional(),
  ),
  categoria: z.enum(CATEGORIAS, { required_error: 'Categoria obrigatória' }),
  colecao: z.string().optional(),
  imagens: z.array(z.string().url()).min(1, 'Adicione pelo menos uma imagem'),
  tamanhos: z
    .array(z.number().int().min(35).max(45))
    .min(1, 'Seleccione pelo menos um tamanho'),
  cores: z
    .array(z.object({ nome: z.string().min(1), hex: z.string().min(1) }))
    .min(1, 'Adicione pelo menos uma cor'),
  stock: z.record(z.number().int().min(0)),
  destaque: z.boolean(),
  emBreve: z.boolean(),
  ativo: z.boolean(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProdutoInicial {
  id?: string
  nome: string
  slug: string
  descricao: string
  preco: number
  precoAntes?: number
  categoria: string
  colecao?: string
  imagens: string[]
  tamanhos: number[]
  cores: { nome: string; hex: string }[]
  stock: Record<string, number>
  destaque: boolean
  emBreve: boolean
  ativo: boolean
  metaTitle?: string
  metaDesc?: string
}

interface Props {
  produto?: ProdutoInicial
}

// ─── Labels ──────────────────────────────────────────────────────────────────

const categoriaLabels: Record<(typeof CATEGORIAS)[number], string> = {
  SALTOS: 'Saltos',
  SANDALIAS: 'Sandálias',
  MULES: 'Mules',
  COLECAO_LIMITADA: 'Coleção Limitada',
}

// ─── Small helper components ──────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-red-500 text-xs mt-1">{msg}</p>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[10px] tracking-widest uppercase text-muted pb-2 border-b border-gray-100 mb-4"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {children}
    </h2>
  )
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[10px] tracking-widest uppercase text-muted mb-1.5"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {children}
    </label>
  )
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-noir placeholder-gray-300 focus:outline-none focus:border-gold/60 transition-colors'

function ToggleField({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-noir">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
          checked ? 'bg-gold' : 'bg-gray-200',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProductForm({ produto }: Props) {
  const router = useRouter()
  const [slugManual, setSlugManual] = useState(!!produto?.slug)
  const [uploading, setUploading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [corNome, setCorNome] = useState('')
  const [corHex, setCorHex] = useState('#000000')

  const defaultValues: FormValues = produto
    ? {
        nome: produto.nome,
        slug: produto.slug,
        descricao: produto.descricao,
        preco: produto.preco,
        precoAntes: produto.precoAntes,
        categoria: produto.categoria as (typeof CATEGORIAS)[number],
        colecao: produto.colecao ?? '',
        imagens: produto.imagens,
        tamanhos: produto.tamanhos,
        cores: produto.cores,
        stock: produto.stock,
        destaque: produto.destaque,
        emBreve: produto.emBreve,
        ativo: produto.ativo,
        metaTitle: produto.metaTitle ?? '',
        metaDesc: produto.metaDesc ?? '',
      }
    : {
        nome: '',
        slug: '',
        descricao: '',
        preco: 0,
        precoAntes: undefined,
        categoria: 'SALTOS',
        colecao: '',
        imagens: [],
        tamanhos: [],
        cores: [],
        stock: {},
        destaque: false,
        emBreve: false,
        ativo: true,
        metaTitle: '',
        metaDesc: '',
      }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  // Watch values for render
  const watchedTamanhos = watch('tamanhos')
  const watchedCores = watch('cores')
  const watchedImagens = watch('imagens')
  const watchedMetaTitle = watch('metaTitle') ?? ''
  const watchedMetaDesc = watch('metaDesc') ?? ''

  // ── Slug auto-generate ───────────────────────────────────────────────────

  const handleNomeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!slugManual) {
        setValue('slug', slugify(e.target.value), { shouldValidate: false })
      }
    },
    [slugManual, setValue],
  )

  function regenerarSlug() {
    setValue('slug', slugify(getValues('nome')), { shouldValidate: true })
    setSlugManual(false)
  }

  // ── Imagens ──────────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        alert(json.error ?? 'Erro no upload')
        return
      }
      const json = (await res.json()) as { url: string }
      const prev = getValues('imagens')
      setValue('imagens', [...prev, json.url], { shouldValidate: true })
    } catch {
      alert('Erro de rede ao fazer upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removerImagem(idx: number) {
    const prev = getValues('imagens')
    setValue(
      'imagens',
      prev.filter((_, i) => i !== idx),
      { shouldValidate: true },
    )
  }

  function moverImagem(idx: number, dir: 'up' | 'down') {
    const prev = [...getValues('imagens')]
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= prev.length) return
    ;[prev[idx], prev[swapIdx]] = [prev[swapIdx], prev[idx]]
    setValue('imagens', prev, { shouldValidate: false })
  }

  // ── Tamanhos ─────────────────────────────────────────────────────────────

  function toggleTamanho(t: number) {
    const current = getValues('tamanhos')
    const next = current.includes(t)
      ? current.filter((x) => x !== t)
      : [...current, t].sort((a, b) => a - b)
    setValue('tamanhos', next, { shouldValidate: true })
  }

  function selectAllTamanhos() {
    setValue('tamanhos', [...TAMANHOS_DISPONIVEIS], { shouldValidate: true })
  }

  function clearTamanhos() {
    setValue('tamanhos', [], { shouldValidate: true })
  }

  // ── Cores ────────────────────────────────────────────────────────────────

  function adicionarCor() {
    const nome = corNome.trim()
    if (!nome) return
    const current = getValues('cores')
    setValue('cores', [...current, { nome, hex: corHex }], { shouldValidate: true })
    // Pre-fill stock for existing tamanhos
    const tamanhos = getValues('tamanhos')
    const stock = { ...getValues('stock') }
    for (const t of tamanhos) {
      const key = `${t}-${nome}`
      if (!(key in stock)) stock[key] = 0
    }
    setValue('stock', stock)
    setCorNome('')
    setCorHex('#000000')
  }

  function removerCor(idx: number) {
    const current = getValues('cores')
    const removida = current[idx]
    setValue(
      'cores',
      current.filter((_, i) => i !== idx),
      { shouldValidate: true },
    )
    // Remove stock entries for this colour
    const stock = getValues('stock')
    const updated: Record<string, number> = {}
    for (const [k, v] of Object.entries(stock)) {
      if (!k.endsWith(`-${removida.nome}`)) updated[k] = v
    }
    setValue('stock', updated)
  }

  // ── Stock ────────────────────────────────────────────────────────────────

  function setStockValue(tamanho: number, corNomeKey: string, raw: string) {
    const val = parseInt(raw, 10)
    const key = `${tamanho}-${corNomeKey}`
    const stock = { ...getValues('stock') }
    stock[key] = isNaN(val) ? 0 : Math.max(0, val)
    setValue('stock', stock)
  }

  function getStockValue(tamanho: number, corNomeKey: string): number {
    return getValues('stock')[`${tamanho}-${corNomeKey}`] ?? 0
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function onSubmit(data: FormValues) {
    setApiError(null)
    const url = produto?.id ? `/api/produtos/${produto.id}` : '/api/produtos'
    const method = produto?.id ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          precoAntes: data.precoAntes ?? undefined,
          colecao: data.colecao || undefined,
          metaTitle: data.metaTitle || undefined,
          metaDesc: data.metaDesc || undefined,
        }),
      })

      if (!res.ok) {
        const json = (await res.json()) as { error?: string | object }
        setApiError(
          typeof json.error === 'string' ? json.error : 'Erro ao guardar o produto',
        )
        return
      }

      router.push('/admin/produtos')
      router.refresh()
    } catch {
      setApiError('Erro de rede. Tente novamente.')
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* ── Informação básica ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <SectionTitle>Informação básica</SectionTitle>

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <FieldLabel htmlFor="nome">Nome *</FieldLabel>
            <input
              id="nome"
              {...register('nome', {
                onChange: handleNomeChange,
              })}
              className={inputCls}
              placeholder="Ex: Sandália Dourada Artesanal"
            />
            <FieldError msg={errors.nome?.message} />
          </div>

          {/* Slug */}
          <div>
            <FieldLabel htmlFor="slug">Slug *</FieldLabel>
            <div className="flex items-stretch">
              <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-xs text-muted whitespace-nowrap">
                kimakyami.com/p/
              </span>
              <input
                id="slug"
                {...register('slug', {
                  onChange: () => setSlugManual(true),
                })}
                className={cn(inputCls, 'rounded-l-none rounded-r-none border-r-0 font-mono text-xs')}
                placeholder="slug-do-produto"
              />
              <button
                type="button"
                onClick={regenerarSlug}
                title="Regenerar slug a partir do nome"
                className="px-3 border border-gray-200 rounded-r-lg hover:bg-gray-50 transition-colors text-muted hover:text-noir"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <FieldError msg={errors.slug?.message} />
          </div>

          {/* Descrição */}
          <div>
            <FieldLabel htmlFor="descricao">Descrição *</FieldLabel>
            <textarea
              id="descricao"
              {...register('descricao')}
              rows={4}
              className={cn(inputCls, 'resize-none')}
              placeholder="Descrição detalhada do produto..."
            />
            <FieldError msg={errors.descricao?.message} />
          </div>

          {/* Preços */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="preco">Preço *</FieldLabel>
              <div className="flex items-stretch">
                <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-muted">
                  €
                </span>
                <input
                  id="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('preco', { valueAsNumber: true })}
                  className={cn(inputCls, 'rounded-l-none')}
                  placeholder="0,00"
                />
              </div>
              <FieldError msg={errors.preco?.message} />
            </div>

            <div>
              <FieldLabel htmlFor="precoAntes">Preço anterior</FieldLabel>
              <div className="flex items-stretch">
                <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-muted">
                  €
                </span>
                <input
                  id="precoAntes"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('precoAntes', { valueAsNumber: true })}
                  className={cn(inputCls, 'rounded-l-none')}
                  placeholder="0,00"
                />
              </div>
              <FieldError msg={errors.precoAntes?.message} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Categoria e coleção ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <SectionTitle>Categoria e coleção</SectionTitle>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="categoria">Categoria *</FieldLabel>
            <select id="categoria" {...register('categoria')} className={cn(inputCls, 'bg-white')}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {categoriaLabels[c]}
                </option>
              ))}
            </select>
            <FieldError msg={errors.categoria?.message} />
          </div>

          <div>
            <FieldLabel htmlFor="colecao">Coleção</FieldLabel>
            <input
              id="colecao"
              {...register('colecao')}
              className={inputCls}
              placeholder="Ex: Verão 2025"
            />
          </div>
        </div>
      </div>

      {/* ── Imagens ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <SectionTitle>Imagens</SectionTitle>

        <div className="space-y-3">
          {watchedImagens.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Imagem ${idx + 1}`}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-50"
              />
              <span className="flex-1 text-xs text-muted font-mono truncate">{url}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moverImagem(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1.5 rounded text-muted hover:text-noir hover:bg-gray-50 disabled:opacity-30 transition-colors"
                  title="Mover para cima"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moverImagem(idx, 'down')}
                  disabled={idx === watchedImagens.length - 1}
                  className="p-1.5 rounded text-muted hover:text-noir hover:bg-gray-50 disabled:opacity-30 transition-colors"
                  title="Mover para baixo"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removerImagem(idx)}
                  className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remover imagem"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 text-xs border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 text-muted hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50 w-full justify-center"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                A carregar...
              </>
            ) : (
              <>
                <Upload size={14} />
                Adicionar imagem
              </>
            )}
          </button>
        </div>

        <FieldError msg={errors.imagens?.message} />
      </div>

      {/* ── Tamanhos ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <SectionTitle>Tamanhos</SectionTitle>

        <Controller
          control={control}
          name="tamanhos"
          render={() => (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={selectAllTamanhos}
                  className="text-xs text-gold hover:underline"
                >
                  Seleccionar todos
                </button>
                <span className="text-gray-300">·</span>
                <button
                  type="button"
                  onClick={clearTamanhos}
                  className="text-xs text-muted hover:text-noir"
                >
                  Nenhum
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {TAMANHOS_DISPONIVEIS.map((t) => {
                  const selected = watchedTamanhos.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTamanho(t)}
                      className={cn(
                        'w-12 h-12 rounded-lg text-sm font-medium border transition-colors',
                        selected
                          ? 'bg-noir text-cream border-noir'
                          : 'bg-white text-noir border-gray-200 hover:border-gray-400',
                      )}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        />
        <FieldError msg={errors.tamanhos?.message} />
      </div>

      {/* ── Cores ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <SectionTitle>Cores</SectionTitle>

        <Controller
          control={control}
          name="cores"
          render={() => (
            <div className="space-y-3">
              {watchedCores.map((cor, idx) => (
                <div
                  key={`${cor.nome}-${idx}`}
                  className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg"
                >
                  <div
                    className="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: cor.hex }}
                  />
                  <span className="flex-1 text-sm text-noir">{cor.nome}</span>
                  <span className="text-xs font-mono text-muted">{cor.hex}</span>
                  <button
                    type="button"
                    onClick={() => removerCor(idx)}
                    className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remover cor"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {/* Adicionar cor inline */}
              <div className="flex items-end gap-2 pt-2">
                <div className="flex-1">
                  <FieldLabel htmlFor="cor-nome">Nome da cor</FieldLabel>
                  <input
                    id="cor-nome"
                    value={corNome}
                    onChange={(e) => setCorNome(e.target.value)}
                    className={inputCls}
                    placeholder="Ex: Noir"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        adicionarCor()
                      }
                    }}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="cor-hex">Cor</FieldLabel>
                  <input
                    id="cor-hex"
                    type="color"
                    value={corHex}
                    onChange={(e) => setCorHex(e.target.value)}
                    className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                </div>
                <button
                  type="button"
                  onClick={adicionarCor}
                  disabled={!corNome.trim()}
                  className="flex items-center gap-1.5 bg-noir text-cream text-xs px-3 py-2 rounded-lg hover:bg-noir/90 disabled:opacity-40 transition-colors h-9"
                >
                  <Plus size={14} />
                  Adicionar
                </button>
              </div>
            </div>
          )}
        />
        <FieldError msg={errors.cores?.message} />
      </div>

      {/* ── Stock ── */}
      {watchedTamanhos.length > 0 && watchedCores.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <SectionTitle>Stock por tamanho / cor</SectionTitle>

          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="text-left text-[10px] tracking-widest uppercase text-muted font-normal pr-6 pb-3">
                    Tamanho
                  </th>
                  {watchedCores.map((cor) => (
                    <th
                      key={cor.nome}
                      className="text-center text-[10px] tracking-widest uppercase text-muted font-normal px-3 pb-3 min-w-[80px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: cor.hex }}
                        />
                        {cor.nome}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {watchedTamanhos.map((t) => (
                  <tr key={t} className="border-t border-gray-50">
                    <td className="pr-6 py-2">
                      <span className="text-sm font-medium text-noir">{t}</span>
                    </td>
                    {watchedCores.map((cor) => (
                      <td key={cor.nome} className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          defaultValue={getStockValue(t, cor.nome)}
                          onChange={(e) => setStockValue(t, cor.nome, e.target.value)}
                          className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center text-noir focus:outline-none focus:border-gold/60 transition-colors"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Visibilidade ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <SectionTitle>Visibilidade</SectionTitle>

        <div className="divide-y divide-gray-50">
          <Controller
            control={control}
            name="ativo"
            render={({ field }) => (
              <ToggleField label="Produto activo" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="destaque"
            render={({ field }) => (
              <ToggleField label="Em destaque" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="emBreve"
            render={({ field }) => (
              <ToggleField label="Em breve" checked={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>

      {/* ── SEO ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <SectionTitle>SEO</SectionTitle>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel htmlFor="metaTitle">Meta título</FieldLabel>
              <span
                className={cn(
                  'text-[10px]',
                  watchedMetaTitle.length > 60 ? 'text-red-500' : 'text-muted',
                )}
              >
                {watchedMetaTitle.length}/60 caracteres
              </span>
            </div>
            <input
              id="metaTitle"
              {...register('metaTitle')}
              className={inputCls}
              placeholder="Título para motores de busca"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel htmlFor="metaDesc">Meta descrição</FieldLabel>
              <span
                className={cn(
                  'text-[10px]',
                  watchedMetaDesc.length > 160 ? 'text-red-500' : 'text-muted',
                )}
              >
                {watchedMetaDesc.length}/160 caracteres
              </span>
            </div>
            <textarea
              id="metaDesc"
              {...register('metaDesc')}
              rows={3}
              className={cn(inputCls, 'resize-none')}
              placeholder="Descrição para motores de busca"
            />
          </div>
        </div>
      </div>

      {/* ── Erro API ── */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {apiError}
        </div>
      )}

      {/* ── Botões ── */}
      <div className="flex items-center justify-end gap-4 pb-8">
        <button
          type="button"
          onClick={() => router.push('/admin/produtos')}
          className="text-sm text-muted hover:text-noir transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-noir text-cream text-xs tracking-widest uppercase px-6 py-3 min-h-12 rounded-lg hover:bg-noir/90 disabled:opacity-60 transition-colors font-sans"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {produto?.id ? 'Guardar alterações' : 'Criar produto'}
        </button>
      </div>
    </form>
  )
}
