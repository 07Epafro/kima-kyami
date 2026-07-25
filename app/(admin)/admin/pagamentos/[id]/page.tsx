import { notFound } from 'next/navigation'
import Link from 'next/link'
import db from '@/lib/db'
import { EstadoPagamento } from '@prisma/client'
import type { ResultadoValidacao } from '@/lib/validar-comprovante'
import DecisaoPagamento from '@/components/admin/DecisaoPagamento'
import { formatarPreco } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Detalhe de Pagamento' }

const ESTADO_CONFIG: Record<EstadoPagamento, { label: string; cls: string }> = {
  AGUARDA_COMPROVANTE: { label: 'Aguarda comprovante', cls: 'bg-gray-100 text-a-muted border border-a-border' },
  COMPROVANTE_SUBMETIDO: { label: 'Comprovante submetido', cls: 'bg-amber-100 text-amber-700' },
  VALIDADO_AUTO_OK: { label: 'Validado auto OK', cls: 'bg-green-100 text-green-700' },
  VALIDADO_AUTO_ALERTA: { label: 'Alerta auto', cls: 'bg-yellow-100 text-yellow-700' },
  VALIDADO_AUTO_REJEITADO: { label: 'Rejeitado auto', cls: 'bg-red-100 text-red-700' },
  CONFIRMADO_ADMIN: { label: 'Confirmado', cls: 'bg-emerald-100 text-emerald-700' },
  REJEITADO_ADMIN: { label: 'Rejeitado', cls: 'bg-red-200 text-red-800' },
}

type Params = { params: Promise<{ id: string }> }

export default async function PagamentoDetalhePage({ params }: Params) {
  const { id } = await params

  const pagamento = await db.pagamento.findUnique({
    where: { id },
    include: {
      encomenda: {
        include: { cliente: true },
      },
    },
  })

  if (!pagamento) notFound()

  const { encomenda } = pagamento
  const resultado = pagamento.validacaoScript as unknown as ResultadoValidacao | null

  const comprovante = pagamento.comprovante
  const isPdf = comprovante?.toLowerCase().endsWith('.pdf')

  const scoreColor =
    resultado === null ? '' :
    resultado.score >= 80 ? 'text-emerald-600' :
    resultado.score >= 50 ? 'text-yellow-600' :
    'text-red-600'

  const scoreBarColor =
    resultado === null ? 'bg-gray-200' :
    resultado.score >= 80 ? 'bg-emerald-500' :
    resultado.score >= 50 ? 'bg-yellow-400' :
    'bg-red-500'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/pagamentos"
          className="inline-flex items-center gap-1.5 text-xs text-a-muted hover:text-a-charcoal transition-colors font-ui"
        >
          <ArrowLeft size={13} /> Todos os pagamentos
        </Link>
        <Link
          href={`/admin/encomendas/${encomenda.id}`}
          className="text-xs text-a-muted hover:text-a-gold transition-colors font-ui"
        >
          Ver encomenda →
        </Link>
      </div>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-a-muted mb-1 font-ui">
            Pagamento
          </p>
          <h1 className="text-lg font-mono text-a-charcoal">{encomenda.referencia}</h1>
          <p className="text-xs text-a-muted mt-0.5 font-ui">
            {encomenda.cliente.nome} · {encomenda.cliente.email}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${ESTADO_CONFIG[pagamento.estado].cls}`}>
            {ESTADO_CONFIG[pagamento.estado].label}
          </span>
          <p className="text-sm font-medium text-a-charcoal mt-2">{formatarPreco(pagamento.valor)}</p>
        </div>
      </div>

      {/* Preview do comprovante */}
      <div className="rounded-lg border border-a-border bg-white p-6">
        <p className="text-xs tracking-widest uppercase text-a-muted mb-4 font-ui">
          Comprovante
        </p>
        {comprovante ? (
          isPdf ? (
            <iframe src={comprovante} className="w-full h-96 rounded border border-a-border" />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={comprovante}
              alt="Comprovante de pagamento"
              className="max-w-full rounded border border-a-border"
            />
          )
        ) : (
          <p className="text-sm text-a-muted font-ui">
            Comprovante não submetido ainda.
          </p>
        )}
      </div>

      {/* Resultado do script */}
      {resultado !== null && (
        <div className="rounded-lg border border-a-border bg-white p-6 space-y-5">
          <p className="text-xs tracking-widest uppercase text-a-muted font-ui">
            Resultado da Validação Automática
          </p>

          {/* Score */}
          <div className="flex items-center gap-4">
            <span className={`text-4xl font-light ${scoreColor}`}>{resultado.score}</span>
            <div className="flex-1">
              <div className="h-2 bg-a-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreBarColor} transition-all`}
                  style={{ width: `${resultado.score}%` }}
                />
              </div>
              <p className="text-[10px] text-a-muted mt-1 font-ui">
                {resultado.estado} · {resultado.score}/100
              </p>
            </div>
          </div>

          {/* Alertas */}
          {resultado.alertas.length > 0 && (
            <div className="space-y-1.5">
              {resultado.alertas.map((alerta, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded font-ui"
                >
                  <span>⚠️</span>
                  <span>{alerta}</span>
                </div>
              ))}
            </div>
          )}

          {/* Detalhes técnicos */}
          <div>
            <p className="text-[10px] tracking-widest uppercase text-a-muted mb-3 font-ui">
              Detalhes técnicos
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-ui">
              <div className="flex justify-between border-b border-a-border/50 py-1.5">
                <span className="text-a-muted">Valor esperado</span>
                <span className="text-a-charcoal">{formatarPreco(resultado.detalhes.valorEsperado)}</span>
              </div>
              <div className="flex justify-between border-b border-a-border/50 py-1.5">
                <span className="text-a-muted">Valor encontrado</span>
                <span className={resultado.detalhes.valorCorreto === true ? 'text-emerald-600' : 'text-red-600'}>
                  {resultado.detalhes.valorEncontrado !== null
                    ? formatarPreco(resultado.detalhes.valorEncontrado)
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between border-b border-a-border/50 py-1.5">
                <span className="text-a-muted">Data encontrada</span>
                <span className={resultado.detalhes.dataValida === true ? 'text-emerald-600' : 'text-red-600'}>
                  {resultado.detalhes.dataEncontrada ?? '—'}
                </span>
              </div>
              <div className="flex justify-between border-b border-a-border/50 py-1.5">
                <span className="text-a-muted">IBAN</span>
                <span className={resultado.detalhes.ibanPresente === true ? 'text-emerald-600' : 'text-red-600'}>
                  {resultado.detalhes.ibanPresente === null ? '—' : resultado.detalhes.ibanPresente ? 'Presente' : 'Ausente'}
                </span>
              </div>
              <div className="flex justify-between border-b border-a-border/50 py-1.5">
                <span className="text-a-muted">Referência</span>
                <span className={resultado.detalhes.referenciaPresente === true ? 'text-emerald-600' : 'text-red-600'}>
                  {resultado.detalhes.referenciaPresente === null ? '—' : resultado.detalhes.referenciaPresente ? 'Presente' : 'Ausente'}
                </span>
              </div>
              <div className="flex justify-between border-b border-a-border/50 py-1.5">
                <span className="text-a-muted">Software edição</span>
                <span className={resultado.detalhes.softwareEdicao ? 'text-red-600' : 'text-a-muted'}>
                  {resultado.detalhes.softwareEdicao ?? 'Nenhum'}
                </span>
              </div>
              <div className="flex justify-between border-b border-a-border/50 py-1.5">
                <span className="text-a-muted">Qualidade imagem</span>
                <span className="text-a-charcoal capitalize">{resultado.detalhes.qualidadeImagem}</span>
              </div>
              <div className="flex justify-between border-b border-a-border/50 py-1.5">
                <span className="text-a-muted">Confiança OCR</span>
                <span className="text-a-charcoal">{Math.round(resultado.detalhes.confiancaOCR * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Texto OCR colapsável */}
          {resultado.detalhes.textoExtraido && (
            <details className="text-xs">
              <summary className="cursor-pointer text-a-muted hover:text-a-charcoal transition-colors py-1 font-ui">
                Ver texto extraído por OCR
              </summary>
              <pre
                className="mt-2 p-3 bg-a-bone rounded text-[11px] text-a-muted whitespace-pre-wrap leading-relaxed overflow-auto max-h-48"
                style={{ fontFamily: 'monospace' }}
              >
                {resultado.detalhes.textoExtraido}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Decisão do Gestor */}
      <DecisaoPagamento pagamentoId={pagamento.id} estadoActual={pagamento.estado} />
    </div>
  )
}
