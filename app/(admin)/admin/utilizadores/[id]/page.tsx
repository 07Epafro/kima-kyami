import { redirect, notFound } from 'next/navigation'
import { UserCog } from 'lucide-react'
import { RoleAdmin } from '@prisma/client'
import { auth } from '@/lib/auth'
import db from '@/lib/db'
import PageHeader from '@/components/admin/PageHeader'
import EditarUtilizadorForm from '@/components/admin/EditarUtilizadorForm'

export const metadata = { title: 'Editar Utilizador' }

type Props = { params: Promise<{ id: string }> }

export default async function EditarUtilizadorPage({ params }: Props) {
  const session = await auth()
  if (session?.user.role !== RoleAdmin.SUPER_ADMIN) redirect('/admin/dashboard')

  const { id } = await params
  const utilizador = await db.admin.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  })
  if (!utilizador) notFound()

  return (
    <div className="max-w-xl">
      <PageHeader icon={UserCog} title="Editar Utilizador" description={utilizador.email} />
      <EditarUtilizadorForm utilizador={utilizador} souEu={utilizador.id === session.user.id} />
    </div>
  )
}
