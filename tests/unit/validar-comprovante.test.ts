import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockRecognize, mockExifrParse } = vi.hoisted(() => ({
  mockRecognize: vi.fn(),
  mockExifrParse: vi.fn(),
}))

vi.mock('tesseract.js', () => ({ default: { recognize: mockRecognize } }))
vi.mock('exifr', () => ({ parse: mockExifrParse }))

import { validarComprovante } from '@/lib/validar-comprovante'
import { gerarReferencia } from '@/lib/utils'

const TOTAL = 89.99
// 'enc-abcdef'.slice(-4).toUpperCase() === 'CDEF' — suffix contains letters,
// which fails the old /\d{4}/ regex and passes the corrected /[A-Z0-9]{4}/ regex
const REFERENCIA = gerarReferencia('enc-abcdef')
const IBAN = 'AO06000000000012345678901'

function criarEncomenda(daysAgo = 5) {
  const criadaEm = new Date()
  criadaEm.setDate(criadaEm.getDate() - daysAgo)
  return { total: TOTAL, referencia: REFERENCIA, criadaEm }
}

function dataValida() {
  const d = new Date()
  d.setDate(d.getDate() - 3)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function palavrasComConfianca(confidence: number, count = 3) {
  return Array.from({ length: count }, () => ({ confidence }))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockExifrParse.mockResolvedValue(null)
})

const fakeBuffer = Buffer.from('fake-image')

describe('validarComprovante', () => {
  it('cenário OK — valor, data, IBAN e referência correctos', async () => {
    const texto = [
      'Transferência bancária MB WAY',
      `Data: ${dataValida()}`,
      `Valor: € ${TOTAL.toFixed(2).replace('.', ',')}`,
      `IBAN: ${IBAN}`,
      `Referência: ${REFERENCIA}`,
    ].join('\n')

    mockRecognize.mockResolvedValue({
      data: { text: texto, words: palavrasComConfianca(85) },
    })

    const resultado = await validarComprovante(fakeBuffer, 'image/jpeg', criarEncomenda())

    expect(resultado.estado).toBe('OK')
    expect(resultado.aprovado).toBe(true)
    expect(resultado.score).toBeGreaterThanOrEqual(80)
    expect(resultado.detalhes.valorCorreto).toBe(true)
    expect(resultado.detalhes.dataValida).toBe(true)
    expect(resultado.detalhes.ibanPresente).toBe(true)
    expect(resultado.detalhes.referenciaPresente).toBe(true)
    expect(resultado.detalhes.imagemAlterada).toBe(false)
  })

  it('cenário ALERTA — valor correcto, IBAN em falta, OCR com baixa confiança', async () => {
    const texto = [
      'Transferência bancária MB WAY',
      `Data: ${dataValida()}`,
      `Valor: € ${TOTAL.toFixed(2).replace('.', ',')}`,
      `Referência: ${REFERENCIA}`,
    ].join('\n')

    mockRecognize.mockResolvedValue({
      data: { text: texto, words: palavrasComConfianca(40) },
    })

    const resultado = await validarComprovante(fakeBuffer, 'image/jpeg', criarEncomenda())

    expect(resultado.estado).toBe('ALERTA')
    expect(resultado.aprovado).toBe(false)
    expect(resultado.score).toBeGreaterThanOrEqual(50)
    expect(resultado.score).toBeLessThan(80)
    expect(resultado.detalhes.valorCorreto).toBe(true)
    expect(resultado.detalhes.ibanPresente).toBe(false)
    expect(resultado.detalhes.confiancaOCR).toBeLessThan(0.5)
  })

  it('cenário REJEITADO — valor errado e data futura', async () => {
    const texto = [
      'Transferência bancária',
      'Data: 01/01/2030',
      'Valor: € 50,00',
      'Sim transferido ok',
    ].join('\n')

    mockRecognize.mockResolvedValue({
      data: { text: texto, words: palavrasComConfianca(85) },
    })

    const resultado = await validarComprovante(fakeBuffer, 'image/jpeg', criarEncomenda())

    expect(resultado.estado).toBe('REJEITADO')
    expect(resultado.aprovado).toBe(false)
    expect(resultado.score).toBeLessThan(50)
    expect(resultado.detalhes.valorCorreto).toBe(false)
    expect(resultado.detalhes.dataValida).toBe(false)
    expect(resultado.alertas).toEqual(
      expect.arrayContaining(['Data do comprovante é futura']),
    )
  })

  it('documento ilegível — Tesseract lança excepção', async () => {
    mockRecognize.mockRejectedValue(new Error('OCR failed'))

    const resultado = await validarComprovante(fakeBuffer, 'image/jpeg', criarEncomenda())

    expect(resultado.estado).toBe('REJEITADO')
    expect(resultado.detalhes.qualidadeImagem).toBe('ilegivel')
    expect(resultado.alertas).toEqual(
      expect.arrayContaining([expect.stringContaining('ilegível')]),
    )
  })

  it('documento ilegível — texto extraído muito curto', async () => {
    mockRecognize.mockResolvedValue({
      data: { text: 'ok', words: [] },
    })

    const resultado = await validarComprovante(fakeBuffer, 'image/jpeg', criarEncomenda())

    expect(resultado.detalhes.qualidadeImagem).toBe('ilegivel')
    expect(resultado.detalhes.valorCorreto).toBeNull()
  })

  it('PDF — salta verificação EXIF', async () => {
    const texto = [
      'Transferência bancária MB WAY',
      `Data: ${dataValida()}`,
      `Valor: € ${TOTAL.toFixed(2).replace('.', ',')}`,
      `IBAN: ${IBAN}`,
      `Referência: ${REFERENCIA}`,
    ].join('\n')

    mockRecognize.mockResolvedValue({
      data: { text: texto, words: palavrasComConfianca(85) },
    })
    mockExifrParse.mockResolvedValue({ Software: 'Adobe Photoshop CC 2024' })

    const resultado = await validarComprovante(fakeBuffer, 'application/pdf', criarEncomenda())

    // EXIF não é lido para PDFs, imagem não deve ser marcada como alterada
    expect(resultado.detalhes.imagemAlterada).toBe(false)
    expect(mockExifrParse).not.toHaveBeenCalled()
  })

  it('data anterior à encomenda — inválida', async () => {
    // Data 10 dias atrás, encomenda criada há 5 dias → data anterior à encomenda
    const d = new Date()
    d.setDate(d.getDate() - 10)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dataAnterior = `${dd}/${mm}/${d.getFullYear()}`

    const texto = [
      'Transferência bancária MB WAY',
      `Data: ${dataAnterior}`,
      `Valor: € ${TOTAL.toFixed(2).replace('.', ',')}`,
      `IBAN: ${IBAN}`,
      `Referência: ${REFERENCIA}`,
    ].join('\n')

    mockRecognize.mockResolvedValue({
      data: { text: texto, words: palavrasComConfianca(85) },
    })

    const resultado = await validarComprovante(fakeBuffer, 'image/jpeg', criarEncomenda(5))

    expect(resultado.detalhes.dataValida).toBe(false)
    expect(resultado.alertas).toEqual(
      expect.arrayContaining([expect.stringContaining('anterior à encomenda')]),
    )
  })

  it('cenário ALERTA — software de edição Photoshop detectado no EXIF', async () => {
    const texto = [
      'Transferência bancária MB WAY',
      `Data: ${dataValida()}`,
      `Valor: € ${TOTAL.toFixed(2).replace('.', ',')}`,
      `IBAN: ${IBAN}`,
      `Referência: ${REFERENCIA}`,
    ].join('\n')

    mockRecognize.mockResolvedValue({
      data: { text: texto, words: palavrasComConfianca(85) },
    })
    mockExifrParse.mockResolvedValue({ Software: 'Adobe Photoshop CC 2024' })

    const resultado = await validarComprovante(fakeBuffer, 'image/jpeg', criarEncomenda())

    expect(resultado.estado).toBe('ALERTA')
    expect(resultado.detalhes.imagemAlterada).toBe(true)
    expect(resultado.detalhes.softwareEdicao).toContain('Photoshop')
    expect(resultado.alertas).toEqual(
      expect.arrayContaining([expect.stringContaining('Software de edição detectado')]),
    )
  })
})
