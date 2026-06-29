import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export const metadata = {
  title: 'Login | Ki Ma Kyami Admin',
}

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/admin/dashboard')

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
            Painel de Administração
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
