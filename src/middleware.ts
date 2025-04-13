import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')
  const excludedRoutes = ['/api/auth', '/api/user']
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isExcludedRoute = excludedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isProtectedApi = !isAuthPage && !isExcludedRoute && request.nextUrl.pathname.startsWith('/api')

  // If trying to access protected routes or APIs without auth, redirect to login or return 401
  if (!accessToken && (isProtectedApi || (!isAuthPage && !request.nextUrl.pathname.startsWith('/api')))) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If trying to access auth pages while logged in, redirect to home
  if (accessToken && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
