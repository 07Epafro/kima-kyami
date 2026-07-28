import { redirect } from 'next/navigation'
import { UserCog } from 'lucide-react'
import { RoleAdmin } from '@prisma/client'
import { auth } from '@/lib/auth'
import PageHeader from '@/components/admin/PageHeader'
import NovoUtilizadorForm from '@/components/admin/NovoUtilizadorForm'

export const metadata = { title: 'Novo Utilizador' }

export default async function NovoUtilizadorPage() {
  const session = await auth()
  if (session?.user.role !== RoleAdmin.SUPER_ADMIN) redirect('/admin/dashboard')

  return (
    <div className="max-w-xl">
      <PageHeader
        icon={UserCog}
        title="Novo Utilizador"
        description="A pessoa recebe um email para definir a própria password — não precisas de partilhar nenhuma."
      />
      <NovoUtilizadorForm />
    </div>
  )
}
