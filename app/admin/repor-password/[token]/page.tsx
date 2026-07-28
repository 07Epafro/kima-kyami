import ReporPasswordForm from './ReporPasswordForm'

export const metadata = {
  title: 'Definir nova password | Kima Kyami Admin',
}

export default async function ReporPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  return (
    <main className="min-h-screen flex items-center justify-center bg-noir px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1
            className="text-6xl font-light tracking-[0.3em] text-gold"
            style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            KK
          </h1>
          <p
            className="mt-2 text-xs tracking-widest uppercase text-muted"
            style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          >
            Nova Password
          </p>
        </div>
        <ReporPasswordForm token={token} />
      </div>
    </main>
  )
}
