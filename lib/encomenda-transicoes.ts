import { EstadoEncomenda } from '@prisma/client'

// Estados a partir dos quais o pagamento já foi confirmado — usar nas somas de
// vendas/receita para não contar carrinhos abandonados (PENDENTE/PAGAMENTO_ANALISE
// que nunca chegaram a ser pagos) como facturação real.
export const ESTADOS_ENCOMENDA_PAGA: EstadoEncomenda[] = [
  EstadoEncomenda.CONFIRMADA,
  EstadoEncomenda.EM_PREPARACAO,
  EstadoEncomenda.ENVIADA,
  EstadoEncomenda.ENTREGUE,
  EstadoEncomenda.DEVOLVIDA,
]

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
