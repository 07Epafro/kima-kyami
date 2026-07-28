import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserCog, Plus, ShieldCheck } from 'lucide-react'
import { RoleAdmin } from '@prisma/client'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import PageHeader from '@/components/admin/PageHeader'

export const metadata = { title: 'Utilizadores' }

const roleLabels: Record<RoleAdmin, string> = {
  SUPER_ADMIN: 'Super Admin',
  GESTOR: 'Gestor',
}
const roleBadge: Record<RoleAdmin, string> = {
  SUPER_ADMIN: 'bg-a-gold/10 text-a-gold border border-a-gold/30',
  GESTOR: 'bg-blue-50 text-blue-700 border border-blue-200',
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase()
}

export default async function UtilizadoresPage() {
  const session = await auth()
  if (session?.user.role !== RoleAdmin.SUPER_ADMIN) redirect('/admin/dashboard')

  const utilizadores = await db.admin.findMany({
    orderBy: { criadoEm: 'asc' },
    select: { id: true, nome: true, email: true, role: true, criadoEm: true },
  })

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        icon={UserCog}
        title="Utilizadores"
        description={`${utilizadores.length} utilizador${utilizadores.length !== 1 ? 'es' : ''} com acesso ao painel.`}
        action={
          <Link href="/admin/utilizadores/novo"
            className="flex items-center gap-2 bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase px-6 min-h-12 rounded-lg hover:bg-a-charcoal/90 transition-colors font-ui whitespace-nowrap shrink-0">
            <Plus size={13} strokeWidth={1.5} /> Novo Utilizador
          </Link>
        }
      />

      <div className="bg-white border border-a-border rounded-lg overflow-hidden shadow-sm">
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-a-border">
          {utilizadores.map((u) => (
            <div key={u.id} className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-full bg-a-bone border border-a-border flex items-center justify-center text-[11px] font-medium text-a-charcoal font-ui">
                {iniciais(u.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-a-charcoal font-display truncate">{u.nome}</p>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-medium font-ui whitespace-nowrap ${roleBadge[u.role]}`}>
                    {roleLabels[u.role]}
                  </span>
                </div>
                <p className="text-[11px] text-a-muted font-ui mb-1">{u.email}</p>
                <p className="text-[10px] text-a-muted font-ui">
                  Desde {u.criadoEm.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[9.5px] tracking-[0.18em] uppercase text-a-muted border-b border-a-border font-ui">
                <th className="px-6 py-3 text-left font-normal">Utilizador</th>
                <th className="px-4 py-3 text-left font-normal">Email</th>
                <th className="px-4 py-3 text-center font-normal">Função</th>
                <th className="px-4 py-3 text-right font-normal">Desde</th>
              </tr>
            </thead>
            <tbody>
              {utilizadores.map((u) => (
                <tr key={u.id} className="border-b border-a-border/50 hover:bg-a-bone transition-colors last:border-0">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-a-bone border border-a-border flex items-center justify-center text-[11px] font-medium text-a-charcoal font-ui">
                        {iniciais(u.nome)}
                      </div>
                      <span className="text-xs font-medium text-a-charcoal">{u.nome}</span>
                      {u.id === session.user.id && (
                        <span className="text-[9px] text-a-muted font-ui">(tu)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-a-muted font-ui">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-medium font-ui ${roleBadge[u.role]}`}>
                      {u.role === RoleAdmin.SUPER_ADMIN && <ShieldCheck size={10} strokeWidth={2} />}
                      {roleLabels[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-a-muted text-right font-ui">
                    {u.criadoEm.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
