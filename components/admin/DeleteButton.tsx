'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

interface Props {
  id: string
}

export default function DeleteButton({ id }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Eliminar produto? Esta acção desactiva o produto.')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        const json = (await res.json()) as { error?: string }
        alert(json.error ?? 'Erro ao eliminar')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      title="Eliminar produto"
      type="button"
    >
      <Trash2 size={15} />
    </button>
  )
}
