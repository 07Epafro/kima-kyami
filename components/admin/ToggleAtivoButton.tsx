'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  id: string
  ativo: boolean
}

export default function ToggleAtivoButton({ id, ativo }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [estado, setEstado] = useState(ativo)

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !estado }),
      })
      if (res.ok) {
        setEstado((prev) => !prev)
        router.refresh()
      } else {
        const json = (await res.json()) as { error?: string }
        alert(json.error ?? 'Erro ao actualizar')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      type="button"
      title={estado ? 'Desactivar produto' : 'Activar produto'}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none ${
        estado ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          estado ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
