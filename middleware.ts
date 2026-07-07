import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session

  const isLoginPage = nextUrl.pathname === '/admin/login'
  const isAuthApi = nextUrl.pathname.startsWith('/api/auth')
  const isAdminPage = nextUrl.pathname.startsWith('/admin')
  const isProtectedApi =
    nextUrl.pathname.startsWith('/api/admin')

  if (isLoginPage || isAuthApi) return NextResponse.next()

  if (isProtectedApi && !isLoggedIn) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (isAdminPage && !isLoggedIn) {
    const loginUrl = new URL('/admin/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
