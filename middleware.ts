import { NextRequest, NextResponse } from 'next/server'

const ADMIN_HOST = 'admin.kimakyami.ao'

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') ?? ''
  const onAdminHost = hostname === ADMIN_HOST
  let pathname = req.nextUrl.pathname
  let rewritten = false

  if (onAdminHost && !pathname.startsWith('/admin')) {
    // Subdomínio admin: mapeia caminhos limpos ("/produtos") para a árvore real ("/admin/produtos").
    // A raiz vai directa para o dashboard, evitando o salto visível de /admin/(admin)/page.tsx.
    pathname = pathname === '/' ? '/admin/dashboard' : `/admin${pathname}`
    rewritten = true
  } else if (!onAdminHost && !pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  if (pathname !== '/admin/login') {
    // Cookie-presence check — JWT verification is in app/(admin)/layout.tsx via auth()
    const hasSession =
      req.cookies.has('authjs.session-token') ||
      req.cookies.has('__Secure-authjs.session-token')

    if (!hasSession) {
      const loginUrl = new URL('/admin/login', req.nextUrl)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (!rewritten) return NextResponse.next()

  const target = req.nextUrl.clone()
  target.pathname = pathname
  return NextResponse.rewrite(target)
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
