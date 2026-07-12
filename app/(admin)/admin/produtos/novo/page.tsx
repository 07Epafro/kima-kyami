import ProductForm from '@/components/admin/ProductForm'

export const metadata = { title: 'Novo Produto' }

export default function NovoProdutoPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-light text-a-charcoal font-display tracking-tight">
          Novo Produto
        </h1>
        <p className="text-sm text-a-muted mt-1 font-ui">
          Preencha os campos abaixo para adicionar um novo produto ao catálogo.
        </p>
      </div>
      <ProductForm />
    </div>
  )
}
