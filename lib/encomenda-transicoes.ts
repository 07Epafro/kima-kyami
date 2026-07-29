import { EstadoEncomenda } from '@prisma/client'

export const TRANSICOES_ENCOMENDA: Record<EstadoEncomenda, EstadoEncomenda[]> = {
  PENDENTE: ['PAGAMENTO_ANALISE', 'CANCELADA'],
  PAGAMENTO_ANALISE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EM_PREPARACAO', 'CANCELADA'],
  EM_PREPARACAO: ['ENVIADA', 'CANCELADA'],
  ENVIADA: ['ENTREGUE'],
  ENTREGUE: ['DEVOLVIDA'],
  CANCELADA: [],
  DEVOLVIDA: [],
}
