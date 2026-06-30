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
  AGUARDA_COMPROVANTE: { label: 'Aguarda comprovante', cls: 'bg-gray-100 text-gray-600' },
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
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-noir transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <ArrowLeft size={13} /> Todos os pagamentos
        </Link>
        <Link
          href={`/admin/encomendas/${encomenda.id}`}
          className="text-xs text-muted hover:text-gold transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Ver encomenda →
        </Link>
      </div>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
            Pagamento
          </p>
          <h1 className="text-lg font-mono text-noir">{encomenda.referencia}</h1>
          <p className="text-xs text-muted mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
            {encomenda.cliente.nome} · {encomenda.cliente.email}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${ESTADO_CONFIG[pagamento.estado].cls}`}>
            {ESTADO_CONFIG[pagamento.estado].label}
          </span>
          <p className="text-sm font-medium text-noir mt-2">{formatarPreco(pagamento.valor)}</p>
        </div>
      </div>

      {/* Preview do comprovante */}
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <p className="text-xs tracking-widest uppercase text-muted mb-4" style={{ fontFamily: 'var(--font-sans)' }}>
          Comprovante
        </p>
        {comprovante ? (
          isPdf ? (
            <iframe src={comprovante} className="w-full h-96 rounded border border-gray-200" />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={comprovante}
              alt="Comprovante de pagamento"
              className="max-w-full rounded border border-gray-100"
            />
          )
        ) : (
          <p className="text-sm text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            Comprovante não submetido ainda.
          </p>
        )}
      </div>

      {/* Resultado do script */}
      {resultado !== null && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-5">
          <p className="text-xs tracking-widest uppercase text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            Resultado da Validação Automática
          </p>

          {/* Score */}
          <div className="flex items-center gap-4">
            <span className={`text-4xl font-light ${scoreColor}`}>{resultado.score}</span>
            <div className="flex-1">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreBarColor} transition-all`}
                  style={{ width: `${resultado.score}%` }}
                />
              </div>
              <p className="text-[10px] text-muted mt-1" style={{ fontFamily: 'var(--font-sans)' }}>
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
                  className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <span>⚠️</span>
                  <span>{alerta}</span>
                </div>
              ))}
            </div>
          )}

          {/* Detalhes técnicos */}
          <div>
            <p className="text-[10px] tracking-widest uppercase text-muted mb-3" style={{ fontFamily: 'var(--font-sans)' }}>
              Detalhes técnicos
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
              <div className="flex justify-between border-b border-gray-50 py-1.5">
                <span className="text-muted">Valor esperado</span>
                <span className="text-noir">{formatarPreco(resultado.detalhes.valorEsperado)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 py-1.5">
                <span className="text-muted">Valor encontrado</span>
                <span className={resultado.detalhes.valorCorreto === true ? 'text-emerald-600' : 'text-red-600'}>
                  {resultado.detalhes.valorEncontrado !== null
                    ? formatarPreco(resultado.detalhes.valorEncontrado)
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 py-1.5">
                <span className="text-muted">Data encontrada</span>
                <span className={resultado.detalhes.dataValida === true ? 'text-emerald-600' : 'text-red-600'}>
                  {resultado.detalhes.dataEncontrada ?? '—'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 py-1.5">
                <span className="text-muted">IBAN</span>
                <span className={resultado.detalhes.ibanPresente === true ? 'text-emerald-600' : 'text-red-600'}>
                  {resultado.detalhes.ibanPresente === null ? '—' : resultado.detalhes.ibanPresente ? 'Presente' : 'Ausente'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 py-1.5">
                <span className="text-muted">Referência</span>
                <span className={resultado.detalhes.referenciaPresente === true ? 'text-emerald-600' : 'text-red-600'}>
                  {resultado.detalhes.referenciaPresente === null ? '—' : resultado.detalhes.referenciaPresente ? 'Presente' : 'Ausente'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 py-1.5">
                <span className="text-muted">Software edição</span>
                <span className={resultado.detalhes.softwareEdicao ? 'text-red-600' : 'text-muted'}>
                  {resultado.detalhes.softwareEdicao ?? 'Nenhum'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 py-1.5">
                <span className="text-muted">Qualidade imagem</span>
                <span className="text-noir capitalize">{resultado.detalhes.qualidadeImagem}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 py-1.5">
                <span className="text-muted">Confiança OCR</span>
                <span className="text-noir">{Math.round(resultado.detalhes.confiancaOCR * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Texto OCR colapsável */}
          {resultado.detalhes.textoExtraido && (
            <details className="text-xs">
              <summary
                className="cursor-pointer text-muted hover:text-noir transition-colors py-1"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Ver texto extraído por OCR
              </summary>
              <pre
                className="mt-2 p-3 bg-gray-50 rounded text-[11px] text-muted whitespace-pre-wrap leading-relaxed overflow-auto max-h-48"
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
