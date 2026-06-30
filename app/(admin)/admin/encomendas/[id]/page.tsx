import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import db from '@/lib/db'
import { EstadoEncomenda } from '@prisma/client'
import { formatarPreco } from '@/lib/utils'
import OrderTimeline from '@/components/admin/OrderTimeline'
import OrderActions from '@/components/admin/OrderActions'
import { ArrowLeft, ExternalLink, Package } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const enc = await db.encomenda.findUnique({ where: { id }, select: { referencia: true } })
  return { title: enc?.referencia ?? 'Encomenda' }
}

const ESTADO_CONFIG: Record<EstadoEncomenda, { label: string; cls: string }> = {
  PENDENTE: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700' },
  PAGAMENTO_ANALISE: { label: 'Em análise', cls: 'bg-blue-100 text-blue-700' },
  CONFIRMADA: { label: 'Confirmada', cls: 'bg-indigo-100 text-indigo-700' },
  EM_PREPARACAO: { label: 'Em preparação', cls: 'bg-purple-100 text-purple-700' },
  ENVIADA: { label: 'Enviada', cls: 'bg-cyan-100 text-cyan-700' },
  ENTREGUE: { label: 'Entregue', cls: 'bg-green-100 text-green-700' },
  CANCELADA: { label: 'Cancelada', cls: 'bg-red-100 text-red-700' },
  DEVOLVIDA: { label: 'Devolvida', cls: 'bg-orange-100 text-orange-700' },
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2
          className="text-xs tracking-widest uppercase text-muted"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {title}
        </h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

export default async function DetalheEncomendaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const encomenda = await db.encomenda.findUnique({
    where: { id },
    include: {
      cliente: true,
      pagamento: true,
      itens: {
        include: { produto: { select: { nome: true, imagens: true, slug: true } } },
      },
    },
  })

  if (!encomenda) notFound()

  const moradaEnvio = encomenda.moradaEnvio as {
    rua: string
    numero?: string
    codigoPostal: string
    cidade: string
    pais: string
  }

  const config = ESTADO_CONFIG[encomenda.estado]

  return (
    <div className="max-w-4xl space-y-5">
      <Link
        href="/admin/encomendas"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-noir transition-colors"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <ArrowLeft size={13} />
        Todas as encomendas
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-lg tracking-widest text-noir">{encomenda.referencia}</p>
          <p className="text-xs text-muted mt-1" style={{ fontFamily: 'var(--font-sans)' }}>
            {encomenda.criadaEm.toLocaleDateString('pt-PT', {
              day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p
            className="text-xl font-light text-noir"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {formatarPreco(encomenda.total)}
          </p>
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${config.cls}`}>
            {config.label}
          </span>
        </div>
      </div>

      <SectionCard title="Percurso">
        <OrderTimeline estadoActual={encomenda.estado} />
        {encomenda.numeroTracking && (
          <div className="mt-4 flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-lg px-4 py-3">
            <Package size={14} className="text-cyan-600" />
            <span className="text-xs text-cyan-700 font-mono">{encomenda.numeroTracking}</span>
          </div>
        )}
      </SectionCard>

      <SectionCard title={`Itens (${encomenda.itens.length})`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-widest uppercase text-muted border-b border-gray-100">
              <th className="pb-3 text-left font-normal" colSpan={2}>Produto</th>
              <th className="pb-3 text-center font-normal">Tam.</th>
              <th className="pb-3 text-center font-normal">Cor</th>
              <th className="pb-3 text-center font-normal">Qtd.</th>
              <th className="pb-3 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {encomenda.itens.map((item) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-3 pr-3 w-12">
                  {item.produto?.imagens[0] ? (
                    <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 shrink-0">
                      <Image
                        src={item.produto.imagens[0]}
                        alt={item.produto.nome}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                      <Package size={16} className="text-muted" />
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <p className="text-xs font-medium text-noir">{item.produto?.nome ?? '—'}</p>
                </td>
                <td className="py-3 text-xs text-center text-muted">{item.tamanho}</td>
                <td className="py-3 text-xs text-center text-muted">{item.cor}</td>
                <td className="py-3 text-xs text-center text-muted">×{item.quantidade}</td>
                <td className="py-3 text-xs text-right font-medium text-noir">
                  {formatarPreco(item.precoUnit * item.quantidade)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="pt-4 text-xs text-muted text-right" style={{ fontFamily: 'var(--font-sans)' }}>
                Subtotal
              </td>
              <td className="pt-4 text-xs text-right text-noir">{formatarPreco(encomenda.subtotal)}</td>
            </tr>
            {encomenda.portes > 0 && (
              <tr>
                <td colSpan={5} className="pt-1 text-xs text-muted text-right">Portes</td>
                <td className="pt-1 text-xs text-right text-noir">{formatarPreco(encomenda.portes)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={5} className="pt-1 text-sm font-medium text-right text-noir" style={{ fontFamily: 'var(--font-sans)' }}>
                Total
              </td>
              <td className="pt-1 text-sm font-medium text-right text-noir">{formatarPreco(encomenda.total)}</td>
            </tr>
          </tfoot>
        </table>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard title="Cliente">
          <div className="space-y-2 text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
            <p className="text-noir font-medium">{encomenda.cliente.nome}</p>
            <p className="text-muted text-xs">{encomenda.cliente.email}</p>
            {encomenda.cliente.telefone && (
              <p className="text-muted text-xs">{encomenda.cliente.telefone}</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[10px] tracking-widest uppercase text-muted mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
              Morada de envio
            </p>
            <address className="not-italic text-xs text-noir leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>
              {moradaEnvio.rua}{moradaEnvio.numero ? `, ${moradaEnvio.numero}` : ''}<br />
              {moradaEnvio.codigoPostal} {moradaEnvio.cidade}<br />
              {moradaEnvio.pais}
            </address>
          </div>
        </SectionCard>

        <SectionCard title="Pagamento">
          {encomenda.pagamento ? (
            <div className="space-y-3 text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">Estado</span>
                <span className="text-xs font-medium text-noir">{encomenda.pagamento.estado.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">Valor</span>
                <span className="text-xs font-medium text-noir">{formatarPreco(encomenda.pagamento.valor)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">IBAN</span>
                <span className="text-xs font-mono text-noir">{encomenda.pagamento.ibanDestinatario}</span>
              </div>
              {encomenda.pagamento.comprovante && (
                <a
                  href={encomenda.pagamento.comprovante}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gold hover:underline"
                >
                  <ExternalLink size={12} />
                  Ver comprovante
                </a>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted">Sem informação de pagamento.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Acções">
        <OrderActions
          encomendaId={encomenda.id}
          estadoActual={encomenda.estado}
          notasActuais={encomenda.notas}
        />
      </SectionCard>
    </div>
  )
}
