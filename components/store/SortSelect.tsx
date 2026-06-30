'use client'

import { useRouter } from 'next/navigation'

interface Ordem {
  value: string
  label: string
}

interface Props {
  ordens: Ordem[]
  defaultValue: string
  categoria?: string
}

export default function SortSelect({ ordens, defaultValue, categoria }: Props) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const p = new URLSearchParams()
    if (categoria) p.set('categoria', categoria)
    p.set('ordem', e.target.value)
    router.push(`/colecoes?${p}`)
  }

  return (
    <select
      defaultValue={defaultValue}
      onChange={handleChange}
      className="text-[10px] tracking-[0.15em] border border-noir/20 px-4 py-2 bg-cream text-noir focus:outline-none focus:border-gold appearance-none cursor-pointer"
      style={{ fontFamily: 'var(--font-sans)' }}
      aria-label="Ordenar por"
    >
      {ordens.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
