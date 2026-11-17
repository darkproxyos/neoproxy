import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

// Bypass temporal mientras el login real de producción está roto (ver
// scripts/reset-root-password.ts) -- OFF por default. Solo afecta /admin,
// nunca /kernel. Ver .env.example para cómo activarlo/desactivarlo.
const BYPASS_ADMIN_AUTH = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === 'true'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isKernelRoute = req.nextUrl.pathname.startsWith('/kernel')
  const isLoginPage = req.nextUrl.pathname === '/login'

  if (isAdminRoute && BYPASS_ADMIN_AUTH) {
    return NextResponse.next()
  }

  if ((isAdminRoute || isKernelRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/darkproxy', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/kernel/:path*', '/login']
}
