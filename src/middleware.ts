// ============================================================
// Next.js Middleware — Route Protection
// Redirects unauthenticated users to /login.
// ============================================================

import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth']

/** Generate a compact trace ID (base36 timestamp + random suffix). */
function generateTraceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isAuthenticated = !!(req as { auth?: unknown }).auth

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Attach trace ID to every response for request correlation
  const response = NextResponse.next()
  const traceId = req.headers.get('x-trace-id') || generateTraceId()
  response.headers.set('x-trace-id', traceId)
  // Pass trace ID downstream via request headers for API route access
  response.headers.set('x-request-trace-id', traceId)
  return response
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
