import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import db from '@/lib/db'
import Sidebar from '@/components/admin/Sidebar'
import TopBar from '@/components/admin/TopBar'
import { EstadoPagamento } from '@prisma/client'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  let pagamentosPendentes = 0
  try {
    pagamentosPendentes = await db.pagamento.count({
      where: { estado: EstadoPagamento.COMPROVANTE_SUBMETIDO },
    })
  } catch { /* badge não crítico — continua sem contagem */ }

  const adminNome = session.user.name ?? 'Admin'
  const adminEmail = session.user.email ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf7f4]">
      <Sidebar
        adminNome={adminNome}
        adminEmail={adminEmail}
        badgeCounts={{ pagamentos: pagamentosPendentes }}
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <TopBar adminNome={adminNome} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
