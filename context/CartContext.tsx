'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

export interface CartItem {
  produtoId: string
  nome: string
  imagem: string
  preco: number
  tamanho: number
  cor: string
  quantidade: number
}

interface CartContextType {
  items: CartItem[]
  total: number
  count: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (item: Omit<CartItem, 'quantidade'> & { quantidade?: number }) => void
  removeItem: (produtoId: string, tamanho: number, cor: string) => void
  updateQty: (produtoId: string, tamanho: number, cor: string, quantidade: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'kk-cart'

function itemKey(produtoId: string, tamanho: number, cor: string) {
  return `${produtoId}::${tamanho}::${cor}`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw) as CartItem[])
    } catch { /* silent */ }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch { /* silent */ }
  }, [items, mounted])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const addItem = useCallback((raw: Omit<CartItem, 'quantidade'> & { quantidade?: number }) => {
    const qty = raw.quantidade ?? 1
    setItems(prev => {
      const key = itemKey(raw.produtoId, raw.tamanho, raw.cor)
      const idx = prev.findIndex(i => itemKey(i.produtoId, i.tamanho, i.cor) === key)
      if (idx !== -1) {
        return prev.map((item, i) =>
          i === idx ? { ...item, quantidade: item.quantidade + qty } : item
        )
      }
      return [...prev, { ...raw, quantidade: qty }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((produtoId: string, tamanho: number, cor: string) => {
    const key = itemKey(produtoId, tamanho, cor)
    setItems(prev => prev.filter(i => itemKey(i.produtoId, i.tamanho, i.cor) !== key))
  }, [])

  const updateQty = useCallback((produtoId: string, tamanho: number, cor: string, quantidade: number) => {
    const key = itemKey(produtoId, tamanho, cor)
    if (quantidade <= 0) {
      setItems(prev => prev.filter(i => itemKey(i.produtoId, i.tamanho, i.cor) !== key))
    } else {
      setItems(prev =>
        prev.map(i => itemKey(i.produtoId, i.tamanho, i.cor) === key ? { ...i, quantidade } : i)
      )
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((s, i) => s + i.preco * i.quantidade, 0)
  const count = items.reduce((s, i) => s + i.quantidade, 0)

  return (
    <CartContext.Provider
      value={{ items, total, count, isOpen, openCart, closeCart, addItem, removeItem, updateQty, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}
