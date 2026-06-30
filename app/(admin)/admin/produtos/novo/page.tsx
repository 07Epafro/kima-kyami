import ProductForm from '@/components/admin/ProductForm'

export const metadata = { title: 'Novo Produto' }

export default function NovoProdutoPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1
          className="text-2xl font-light text-noir"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Novo Produto
        </h1>
        <p className="text-sm text-muted mt-1" style={{ fontFamily: 'var(--font-sans)' }}>
          Preencha os campos abaixo para adicionar um novo produto ao catálogo.
        </p>
      </div>
      <ProductForm />
    </div>
  )
}
