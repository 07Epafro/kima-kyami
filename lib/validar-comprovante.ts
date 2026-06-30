import Tesseract from 'tesseract.js'
import * as exifr from 'exifr'

export interface ResultadoValidacao {
  aprovado: boolean
  score: number
  estado: 'OK' | 'ALERTA' | 'REJEITADO'
  alertas: string[]
  detalhes: {
    valorCorreto: boolean | null
    valorEncontrado: number | null
    valorEsperado: number
    dataValida: boolean | null
    dataEncontrada: string | null
    ibanPresente: boolean | null
    referenciaPresente: boolean | null
    imagemAlterada: boolean
    softwareEdicao: string | null
    qualidadeImagem: 'boa' | 'baixa' | 'ilegivel'
    confiancaOCR: number
    textoExtraido: string
  }
}

export async function validarComprovante(
  ficheiro: Buffer,
  mimeType: string,
  encomenda: { total: number; referencia: string; criadaEm: Date }
): Promise<ResultadoValidacao> {
  const alertas: string[] = []

  // a) EXIF — apenas para imagens
  let softwareEdicao: string | null = null
  let imagemAlterada = false

  if (mimeType !== 'application/pdf') {
    try {
      const exif = await exifr.parse(ficheiro, { software: true, xmp: true, tiff: true })
      const software = exif?.Software ?? exif?.software ?? exif?.ProcessingSoftware ?? ''
      const softwareLower = String(software).toLowerCase()
      const editores = ['photoshop', 'gimp', 'lightroom', 'affinity', 'pixelmator', 'paint.net', 'canva']
      const encontrado = editores.find(e => softwareLower.includes(e))
      if (encontrado) {
        softwareEdicao = software as string
        imagemAlterada = true
      }
    } catch {
      /* ficheiro sem EXIF é normal */
    }
  }

  // b) OCR com Tesseract
  let textoExtraido = ''
  let confiancaOCR = 0
  let qualidadeImagem: 'boa' | 'baixa' | 'ilegivel' = 'ilegivel'

  try {
    const { data } = await Tesseract.recognize(ficheiro, 'por')
    textoExtraido = data.text ?? ''
    if (data.words && data.words.length > 0) {
      const soma = data.words.reduce((acc, w) => acc + w.confidence, 0)
      confiancaOCR = soma / data.words.length / 100
    }
    if (textoExtraido.length < 20) {
      qualidadeImagem = 'ilegivel'
    } else if (confiancaOCR < 0.5) {
      qualidadeImagem = 'baixa'
    } else {
      qualidadeImagem = 'boa'
    }
  } catch {
    textoExtraido = ''
    confiancaOCR = 0
    qualidadeImagem = 'ilegivel'
    alertas.push('Documento ilegível — não foi possível extrair texto')
  }

  // c) Análise do texto extraído

  // Valor
  let valorCorreto: boolean | null = null
  let valorEncontrado: number | null = null

  if (textoExtraido.length >= 20) {
    const regexValor = /(?:EUR?|€)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/gi
    const valoresEncontrados: number[] = []
    let match: RegExpExecArray | null
    while ((match = regexValor.exec(textoExtraido)) !== null) {
      const raw = match[1]
      // Normalizar: remover ponto de milhar, substituir vírgula decimal por ponto
      const normalizado = raw.replace(/\./g, '').replace(',', '.')
      const valor = parseFloat(normalizado)
      if (!isNaN(valor)) {
        valoresEncontrados.push(valor)
      }
    }
    const correspondente = valoresEncontrados.find(v => Math.abs(v - encomenda.total) <= 0.01)
    if (valoresEncontrados.length === 0) {
      valorCorreto = false
      alertas.push('Valor não encontrado no documento')
    } else if (correspondente !== undefined) {
      valorCorreto = true
      valorEncontrado = correspondente
    } else {
      valorCorreto = false
      valorEncontrado = valoresEncontrados[0] ?? null
      const encontradoFmt = valorEncontrado !== null
        ? `€${valorEncontrado.toFixed(2).replace('.', ',')}`
        : '?'
      const esperadoFmt = `€${encomenda.total.toFixed(2).replace('.', ',')}`
      alertas.push(`Valor encontrado (${encontradoFmt}) não corresponde ao esperado (${esperadoFmt})`)
    }
  } else {
    valorCorreto = null
  }

  // Data
  let dataValida: boolean | null = null
  let dataEncontrada: string | null = null

  if (textoExtraido.length >= 20) {
    const regexData = /(\d{2})[/\-.:](\d{2})[/\-.:](\d{4})/g
    let matchData: RegExpExecArray | null
    let dataOk = false
    while ((matchData = regexData.exec(textoExtraido)) !== null) {
      const dia = parseInt(matchData[1])
      const mes = parseInt(matchData[2])
      const ano = parseInt(matchData[3])
      if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
        const dataDoc = new Date(ano, mes - 1, dia)
        const agora = new Date()
        const setesDias = new Date(encomenda.criadaEm)
        setesDias.setDate(setesDias.getDate() + 7)

        dataEncontrada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`

        if (dataDoc > agora) {
          alertas.push('Data do comprovante é futura')
          dataValida = false
        } else if (dataDoc < encomenda.criadaEm) {
          alertas.push('Data do comprovante é anterior à encomenda')
          dataValida = false
        } else if (dataDoc > setesDias) {
          alertas.push('Data do comprovante é mais de 7 dias após a encomenda')
          dataValida = false
        } else {
          dataValida = true
          dataOk = true
          break
        }
      }
    }
    if (dataEncontrada === null) {
      alertas.push('Data não encontrada ou inválida')
      dataValida = false
    } else if (!dataOk && dataValida === null) {
      dataValida = false
    }
  }

  // IBAN
  let ibanPresente: boolean | null = null

  if (textoExtraido.length >= 20) {
    const ibanLoja = process.env.IBAN_LOJA ?? ''
    const regexIban = /AO\s*06\s*[\d\s]{21,30}/gi
    const matchesIban = textoExtraido.match(regexIban)
    if (matchesIban && ibanLoja) {
      const ibanLojaLimpo = ibanLoja.replace(/\s/g, '').toUpperCase()
      const encontradoValido = matchesIban.some(m => {
        const limpo = m.replace(/\s/g, '').toUpperCase()
        return limpo.startsWith(ibanLojaLimpo.substring(0, 10))
      })
      ibanPresente = encontradoValido
      if (!encontradoValido) {
        alertas.push('IBAN não encontrado ou não corresponde')
      }
    } else if (matchesIban && matchesIban.length > 0) {
      ibanPresente = true
    } else {
      ibanPresente = false
      alertas.push('IBAN não encontrado ou não corresponde')
    }
  }

  // Referência
  let referenciaPresente: boolean | null = null

  if (textoExtraido.length >= 20) {
    const regexRef = /KK[\s\-]?\d{4}[\s\-]?[A-Z0-9]{4}/i
    referenciaPresente = regexRef.test(textoExtraido)
    if (!referenciaPresente) {
      alertas.push('Referência da encomenda não encontrada')
    }
  }

  // Alertas adicionais de qualidade
  if (qualidadeImagem === 'ilegivel' && !alertas.includes('Documento ilegível — não foi possível extrair texto')) {
    alertas.push('Documento ilegível — não foi possível extrair texto')
  } else if (qualidadeImagem === 'baixa') {
    alertas.push('Qualidade de imagem baixa — validação manual recomendada')
  }

  if (imagemAlterada && softwareEdicao) {
    alertas.push(`Software de edição detectado: ${softwareEdicao}`)
  }

  // d) Score
  let score = 0
  if (valorCorreto === true) score += 35
  if (dataValida === true) score += 25
  if (ibanPresente === true) score += 20
  if (referenciaPresente === true) score += 15
  if (!imagemAlterada) score += 5
  if (imagemAlterada) score -= 30
  if (confiancaOCR < 0.5 && qualidadeImagem !== 'ilegivel') score -= 10
  score = Math.max(0, Math.min(100, score))

  // e) Classificação
  const estado: 'OK' | 'ALERTA' | 'REJEITADO' =
    score >= 80 ? 'OK' : score >= 50 ? 'ALERTA' : 'REJEITADO'

  return {
    aprovado: estado === 'OK',
    score,
    estado,
    alertas,
    detalhes: {
      valorCorreto,
      valorEncontrado,
      valorEsperado: encomenda.total,
      dataValida,
      dataEncontrada,
      ibanPresente,
      referenciaPresente,
      imagemAlterada,
      softwareEdicao,
      qualidadeImagem,
      confiancaOCR,
      textoExtraido,
    },
  }
}
