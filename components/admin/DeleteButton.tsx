'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useConfirm } from './ConfirmDialog'
import { useToast } from './Toast'

interface Props {
  id: string
}

export default function DeleteButton({ id }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { confirmar, dialog } = useConfirm()
  const { mostrarErro, toastContainer } = useToast()

  async function handleDelete() {
    const ok = await confirmar('Eliminar produto?', {
      descricao: 'Esta acção desactiva o produto.',
      labelConfirmar: 'Eliminar',
      perigo: true,
    })
    if (!ok) return

    setLoading(true)
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        const json = (await res.json()) as { error?: string }
        mostrarErro(json.error ?? 'Erro ao eliminar')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        title="Eliminar produto"
        type="button"
      >
        <Trash2 size={15} />
      </button>
      {dialog}
      {toastContainer}
    </>
  )
}
