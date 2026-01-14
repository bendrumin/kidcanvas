import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip cookie-based auth for API routes that use Bearer tokens (mobile clients)
  // These routes handle their own authentication via Authorization header
  // Note: Next.js normalizes headers to lowercase
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  const isBearerAuth = authHeader?.startsWith('Bearer ')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  console.log('🔵 [Middleware] Request:', request.nextUrl.pathname)
  console.log('  - Has authorization header (lowercase):', !!request.headers.get('authorization'))
  console.log('  - Has Authorization header (uppercase):', !!request.headers.get('Authorization'))
  console.log('  - Is Bearer auth:', isBearerAuth)
  console.log('  - Is API route:', isApiRoute)

  if (isBearerAuth && isApiRoute) {
    // Mobile client using Bearer token - skip middleware auth, let API route handle it
    console.log('🔵 [Middleware] Bypassing auth for Bearer token API request:', request.nextUrl.pathname)
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from auth pages to dashboard
  if (
    user &&
    (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

