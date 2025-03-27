import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login']

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')

  // Check if the path is public
  if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // If no session exists, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Allow the request to proceed
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|_next|fonts|favicon.ico|sitemap.xml).*)',
  ],
} 