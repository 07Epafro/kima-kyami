export type CategoriaEnum = 'SALTOS' | 'SANDALIAS' | 'MULES' | 'COLECAO_LIMITADA'

export type EstadoEncomenda =
  | 'PENDENTE'
  | 'PAGAMENTO_ANALISE'
  | 'CONFIRMADA'
  | 'EM_PREPARACAO'
  | 'ENVIADA'
  | 'ENTREGUE'
  | 'CANCELADA'
  | 'DEVOLVIDA'

export type EstadoPagamento =
  | 'AGUARDA_COMPROVANTE'
  | 'COMPROVANTE_SUBMETIDO'
  | 'VALIDADO_AUTO_OK'
  | 'VALIDADO_AUTO_ALERTA'
  | 'VALIDADO_AUTO_REJEITADO'
  | 'CONFIRMADO_ADMIN'
  | 'REJEITADO_ADMIN'

export type RoleAdmin = 'SUPER_ADMIN' | 'GESTOR'

export interface CorProduto {
  nome: string
  hex: string
}

export interface Produto {
  id: string
  nome: string
  slug: string
  descricao: string
  preco: number
  precoAntes?: number | null
  categoria: CategoriaEnum
  colecao?: string | null
  imagens: string[]
  tamanhos: number[]
  cores: CorProduto[]
  stock: Record<string, number>
  destaque: boolean
  emBreve: boolean
  ativo: boolean
  metaTitle?: string | null
  metaDesc?: string | null
  criadoEm: Date
  atualizadoEm: Date
}

export interface Morada {
  rua: string
  numero?: string
  codigoPostal: string
  cidade: string
  pais: string
}

export interface Cliente {
  id: string
  nome: string
  email: string
  telefone?: string | null
  morada?: Morada | null
  criadoEm: Date
}

export interface ItemEncomenda {
  id: string
  encomendaId: string
  produtoId: string
  produto?: Produto
  tamanho: number
  cor: string
  quantidade: number
  precoUnit: number
}

export interface ValidacaoScript {
  ocr?: string
  valorDetectado?: number
  ibanDetectado?: string
  dataDetectada?: string
  confianca?: number
  alertas?: string[]
}

export interface Pagamento {
  id: string
  encomendaId: string
  valor: number
  ibanDestinatario: string
  referencia: string
  comprovante?: string | null
  estado: EstadoPagamento
  validacaoScript?: ValidacaoScript | null
  validacaoAdmin?: boolean | null
  notaAdmin?: string | null
  criadoEm: Date
  verificadoEm?: Date | null
}

export interface Encomenda {
  id: string
  referencia: string
  clienteId: string
  cliente?: Cliente
  itens: ItemEncomenda[]
  pagamento?: Pagamento | null
  subtotal: number
  portes: number
  total: number
  moradaEnvio: Morada
  estado: EstadoEncomenda
  notas?: string | null
  criadaEm: Date
  atualizadaEm: Date
}

export interface Admin {
  id: string
  nome: string
  email: string
  role: RoleAdmin
  criadoEm: Date
}

export interface ResultadoValidacao {
  valido: boolean
  erros: string[]
  avisos?: string[]
}
