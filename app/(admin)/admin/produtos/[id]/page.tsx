import { notFound } from 'next/navigation'
import db from '@/lib/db'
import ProductForm from '@/components/admin/ProductForm'
import { formatarPreco } from '@/lib/utils'
import { EstadoEncomenda } from '@prisma/client'

export const metadata = { title: 'Editar Produto' }

const estadoLabels: Record<EstadoEncomenda, string> = {
  PENDENTE: 'Pendente',
  PAGAMENTO_ANALISE: 'Em análise',
  CONFIRMADA: 'Confirmada',
  EM_PREPARACAO: 'Em preparação',
  ENVIADA: 'Enviada',
  ENTREGUE: 'Entregue',
  CANCELADA: 'Cancelada',
  DEVOLVIDA: 'Devolvida',
}

const estadoCores: Record<EstadoEncomenda, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700',
  PAGAMENTO_ANALISE: 'bg-blue-100 text-blue-700',
  CONFIRMADA: 'bg-green-100 text-green-700',
  EM_PREPARACAO: 'bg-purple-100 text-purple-700',
  ENVIADA: 'bg-indigo-100 text-indigo-700',
  ENTREGUE: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-red-100 text-red-700',
  DEVOLVIDA: 'bg-orange-100 text-orange-700',
}

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const produto = await db.produto.findUnique({ where: { id } })
  if (!produto) notFound()

  const historico = await db.itemEncomenda.findMany({
    where: { produtoId: id },
    include: {
      encomenda: {
        select: { referencia: true, criadaEm: true, total: true, estado: true },
      },
    },
    orderBy: { encomenda: { criadaEm: 'desc' } },
    take: 10,
  })

  // Build a plain, serialisable object (Prisma JSON → typed)
  const produtoParaForm = {
    id: produto.id,
    nome: produto.nome,
    slug: produto.slug,
    descricao: produto.descricao,
    preco: produto.preco,
    precoAntes: produto.precoAntes ?? undefined,
    categoria: produto.categoria,
    colecao: produto.colecao ?? undefined,
    imagens: produto.imagens,
    tamanhos: produto.tamanhos,
    cores: produto.cores as unknown as { nome: string; hex: string }[],
    stock: produto.stock as unknown as Record<string, number>,
    destaque: produto.destaque,
    emBreve: produto.emBreve,
    ativo: produto.ativo,
    metaTitle: produto.metaTitle ?? undefined,
    metaDesc: produto.metaDesc ?? undefined,
  }

  return (
    <div className="max-w-4xl space-y-10">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-light text-a-charcoal font-display tracking-tight">
          Editar Produto
        </h1>
        <p className="text-sm text-a-muted mt-1 font-ui">
          {produto.nome}{' '}
          <span className="font-mono text-xs">· {produto.slug}</span>
        </p>
      </div>

      {/* Formulário */}
      <ProductForm produto={produtoParaForm} />

      {/* Histórico de vendas */}
      <div className="bg-white rounded-lg border border-a-border overflow-hidden">
        <div className="px-6 py-4 border-b border-a-border">
          <h2 className="text-[9.5px] tracking-[0.22em] uppercase text-a-muted font-ui">
            Histórico de vendas (últimas 10)
          </h2>
        </div>

        {historico.length === 0 ? (
          <p className="px-6 py-8 text-sm text-a-muted text-center font-ui">
            Este produto ainda não foi vendido.
          </p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[9.5px] tracking-[0.18em] uppercase text-a-muted border-b border-a-border font-ui">
                <th className="px-6 py-3 text-left font-normal">Encomenda</th>
                <th className="px-4 py-3 text-right font-normal">Total enc.</th>
                <th className="px-4 py-3 text-center font-normal">Estado</th>
                <th className="px-4 py-3 text-right font-normal">Data</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-a-border/50 hover:bg-a-bone transition-colors last:border-0"
                >
                  <td className="px-6 py-3">
                    <span className="font-mono text-xs text-a-charcoal">
                      {item.encomenda.referencia}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-right font-medium text-a-charcoal font-ui">
                    {formatarPreco(item.encomenda.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                        estadoCores[item.encomenda.estado]
                      }`}
                    >
                      {estadoLabels[item.encomenda.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-a-muted text-right font-ui">
                    {item.encomenda.criadaEm.toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
