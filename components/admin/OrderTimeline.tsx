import { EstadoEncomenda } from '@prisma/client'
import { Check, X, RotateCcw } from 'lucide-react'

const SEQUENCIA: EstadoEncomenda[] = [
  'PENDENTE',
  'PAGAMENTO_ANALISE',
  'CONFIRMADA',
  'EM_PREPARACAO',
  'ENVIADA',
  'ENTREGUE',
]

const LABELS: Record<EstadoEncomenda, string> = {
  PENDENTE: 'Pendente',
  PAGAMENTO_ANALISE: 'Pagamento em análise',
  CONFIRMADA: 'Confirmada',
  EM_PREPARACAO: 'Em preparação',
  ENVIADA: 'Enviada',
  ENTREGUE: 'Entregue',
  CANCELADA: 'Cancelada',
  DEVOLVIDA: 'Devolvida',
}

interface Props {
  estadoActual: EstadoEncomenda
}

export default function OrderTimeline({ estadoActual }: Props) {
  const isCancelada = estadoActual === 'CANCELADA'
  const isDevolvida = estadoActual === 'DEVOLVIDA'
  const indexActual = SEQUENCIA.indexOf(estadoActual)

  return (
    <div>
      <div className="flex items-start gap-0">
        {SEQUENCIA.map((estado, idx) => {
          const passou = indexActual > idx || isDevolvida
          const actual = indexActual === idx && !isCancelada && !isDevolvida
          const futuro = indexActual < idx && !isCancelada && !isDevolvida

          return (
            <div key={estado} className="flex-1 flex flex-col items-center">
              <div className="relative flex items-center w-full">
                {idx > 0 && (
                  <div
                    className={`absolute left-0 right-1/2 h-0.5 top-1/2 -translate-y-1/2 ${
                      passou || (actual && idx > 0) ? 'bg-a-gold' : 'bg-a-border'
                    }`}
                  />
                )}
                {idx < SEQUENCIA.length - 1 && (
                  <div
                    className={`absolute left-1/2 right-0 h-0.5 top-1/2 -translate-y-1/2 ${
                      passou ? 'bg-a-gold' : 'bg-a-border'
                    }`}
                  />
                )}
                <div className="relative mx-auto z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      passou
                        ? 'bg-a-gold border-a-gold'
                        : actual
                          ? 'bg-a-gold/20 border-a-gold animate-pulse'
                          : 'bg-white border-a-border'
                    }`}
                  >
                    {passou ? (
                      <Check size={14} className="text-a-charcoal" strokeWidth={2.5} />
                    ) : actual ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-a-gold" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-a-border" />
                    )}
                  </div>
                </div>
              </div>
              <p
                className={`mt-2 text-center text-[10px] leading-tight px-1 font-ui ${
                  actual ? 'text-a-charcoal font-semibold' : passou ? 'text-a-gold' : 'text-a-muted'
                }`}
              >
                {LABELS[estado]}
              </p>
            </div>
          )
        })}
      </div>

      {isCancelada && (
        <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <X size={16} className="text-red-500 shrink-0" />
          <span className="text-sm text-red-700 font-ui">
            Encomenda cancelada
          </span>
        </div>
      )}

      {isDevolvida && (
        <div className="mt-4 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
          <RotateCcw size={16} className="text-orange-500 shrink-0" />
          <span className="text-sm text-orange-700 font-ui">
            Encomenda devolvida
          </span>
        </div>
      )}
    </div>
  )
}
