import ImagensSiteManager from '@/components/admin/ImagensSiteManager'

export const metadata = { title: 'Imagens do Site' }

export default function ImagensSitePage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-light text-a-charcoal tracking-tight font-display">
          Imagens do Site
        </h1>
        <p className="text-sm text-a-muted mt-1 font-ui">
          Substitui as imagens usadas na página inicial, em &quot;A Marca&quot; e no Lookbook. As alterações ficam visíveis no site em poucos segundos.
        </p>
      </div>

      <ImagensSiteManager />
    </div>
  )
}
