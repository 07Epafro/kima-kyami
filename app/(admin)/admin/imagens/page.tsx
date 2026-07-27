import { Image as ImageIcon } from 'lucide-react'
import ImagensSiteManager from '@/components/admin/ImagensSiteManager'
import PageHeader from '@/components/admin/PageHeader'

export const metadata = { title: 'Imagens do Site' }

export default function ImagensSitePage() {
  return (
    <div>
      <PageHeader
        icon={ImageIcon}
        title="Imagens do Site"
        description={'Substitui as imagens usadas na página inicial, em "A Marca" e no Lookbook. As alterações ficam visíveis no site em poucos segundos.'}
      />

      <ImagensSiteManager />
    </div>
  )
}
