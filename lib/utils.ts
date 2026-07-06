import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatarPreco(valor: number): string {
  return `Kz ${valor.toFixed(2).replace('.', ',')}`
}

export function gerarReferencia(id: string): string {
  const ano = new Date().getFullYear()
  const sufixo = id.slice(-4).toUpperCase()
  return `KK-${ano}-${sufixo}`
}

export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
