import { describe, it, expect } from 'vitest'
import { formatarPreco, gerarReferencia, slugify } from '@/lib/utils'

describe('formatarPreco', () => {
  it('formats zero', () => {
    expect(formatarPreco(0)).toBe('€ 0,00')
  })

  it('formats integer', () => {
    expect(formatarPreco(150)).toBe('€ 150,00')
  })

  it('formats decimal', () => {
    expect(formatarPreco(99.99)).toBe('€ 99,99')
  })

  it('formats large value', () => {
    expect(formatarPreco(1250.5)).toBe('€ 1250,50')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatarPreco(1.999)).toBe('€ 2,00')
  })
})

describe('gerarReferencia', () => {
  const ano = new Date().getFullYear()

  it('returns correct format KK-YEAR-SUFFIX', () => {
    expect(gerarReferencia('abc123def456')).toBe(`KK-${ano}-F456`)
  })

  it('uppercases suffix', () => {
    expect(gerarReferencia('xxxxxxxxxabcd')).toBe(`KK-${ano}-ABCD`)
  })

  it('uses last 4 characters', () => {
    expect(gerarReferencia('12345678')).toBe(`KK-${ano}-5678`)
  })
})

describe('slugify', () => {
  it('lowercases', () => {
    expect(slugify('SALTOS')).toBe('saltos')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('Saltos Altos')).toBe('saltos-altos')
  })

  it('removes accents', () => {
    expect(slugify('Sandálias')).toBe('sandalias')
  })

  it('handles ç and ã', () => {
    expect(slugify('Coleção Limitada')).toBe('colecao-limitada')
  })

  it('trims leading and trailing spaces', () => {
    expect(slugify('  hello world  ')).toBe('hello-world')
  })

  it('collapses multiple spaces', () => {
    expect(slugify('saltos   altos')).toBe('saltos-altos')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('saltos--altos')).toBe('saltos-altos')
  })

  it('removes special characters', () => {
    expect(slugify('hello! world?')).toBe('hello-world')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })
})
