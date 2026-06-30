import { notFound } from 'next/navigation'
import Link from 'next/link'
import db from '@/lib/db'
import { EstadoEncomenda } from '@prisma/client'
import { formatarPreco } from '@/lib/utils'
import ClienteEditForm from '@/components/admin/ClienteEditForm'
import EnviarEmailButton from '@/components/admin/EnviarEmailButton'
import { ArrowLeft } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await db.cliente.findUnique({ where: { id }, select: { nome: true } })
  return { title: c?.nome ?? 'Cliente' }
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

const CATEGORIA_LABELS: Record<string, string> = {
  SALTOS: 'Saltos',
  SANDALIAS: 'Sandálias',
  MULES: 'Mules',
  COLECAO_LIMITADA: 'Coleção Limitada',
}

export default async function ClientePerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const cliente = await db.cliente.findUnique({
    where: { id },
    include: {
      encomendas: {
        orderBy: { criadaEm: 'desc' },
        include: {
          _count: { select: { itens: true } },
          itens: { include: { produto: { select: { categoria: true } } } },
        },
      },
    },
  })

  if (!cliente) notFound()

  const encomendasValidas = cliente.encomendas.filter((e) => e.estado !== 'CANCELADA')
  const totalGasto = encomendasValidas.reduce((s, e) => s + e.total, 0)
  const encomendaMedia = encomendasValidas.length > 0 ? totalGasto / encomendasValidas.length : 0

  const contCategoria: Record<string, number> = {}
  for (const enc of encomendasValidas) {
    for (const item of enc.itens) {
      const cat = item.produto?.categoria ?? 'OUTRO'
      contCategoria[cat] = (contCategoria[cat] ?? 0) + item.quantidade
    }
  }
  const categoriasPreferidas = Object.entries(contCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const morada = cliente.morada as {
    rua?: string; codigoPostal?: string; cidade?: string; pais?: string
  } | null

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/clientes"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-noir transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <ArrowLeft size={13} /> Todos os clientes
        </Link>
        <EnviarEmailButton clienteId={cliente.id} clienteEmail={cliente.email} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 px-6 py-5">
        <ClienteEditForm
          clienteId={cliente.id}
          nome={cliente.nome}
          email={cliente.email}
          telefone={cliente.telefone}
          morada={morada}
          notas={cliente.notas}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total gasto', valor: totalGasto > 0 ? formatarPreco(totalGasto) : '—' },
          { label: 'Encomenda média', valor: encomendaMedia > 0 ? formatarPreco(encomendaMedia) : '—' },
          { label: 'Total encomendas', valor: String(cliente.encomendas.length) },
        ].map(({ label, valor }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-[10px] tracking-widest uppercase text-muted mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
              {label}
            </p>
            <p className="text-xl font-light text-noir" style={{ fontFamily: 'var(--font-serif)' }}>
              {valor}
            </p>
          </div>
        ))}
      </div>

      {categoriasPreferidas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 px-6 py-5">
          <h2 className="text-[10px] tracking-widest uppercase text-muted mb-3" style={{ fontFamily: 'var(--font-sans)' }}>
            Categorias preferidas
          </h2>
          <div className="flex flex-wrap gap-2">
            {categoriasPreferidas.map(([cat, qty]) => (
              <span
                key={cat}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-noir text-xs rounded-full"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {CATEGORIA_LABELS[cat] ?? cat}
                <span className="text-muted">×{qty}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-[10px] tracking-widest uppercase text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            Histórico de encomendas ({cliente.encomendas.length})
          </h2>
        </div>
        {cliente.encomendas.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted text-center">Sem encomendas ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] tracking-widest uppercase text-muted border-b border-gray-50">
                <th className="px-6 py-3 text-left font-normal">Referência</th>
                <th className="px-4 py-3 text-center font-normal">Itens</th>
                <th className="px-4 py-3 text-right font-normal">Total</th>
                <th className="px-4 py-3 text-left font-normal">Estado</th>
                <th className="px-4 py-3 text-right font-normal">Data</th>
              </tr>
            </thead>
            <tbody>
              {cliente.encomendas.map((enc) => (
                <tr key={enc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <Link
                      href={`/admin/encomendas/${enc.id}`}
                      className="font-mono text-xs text-noir hover:text-gold transition-colors"
                    >
                      {enc.referencia}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-center text-muted">{enc._count.itens}</td>
                  <td className="px-4 py-3 text-xs text-right font-medium text-noir">
                    {formatarPreco(enc.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${ESTADO_CONFIG[enc.estado].cls}`}>
                      {ESTADO_CONFIG[enc.estado].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-muted text-right">
                    {enc.criadaEm.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
