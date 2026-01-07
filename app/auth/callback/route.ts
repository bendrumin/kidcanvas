import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect')
  const type = searchParams.get('type') // 'signup', 'email', 'recovery', etc.

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if this is an email verification or password recovery
      const isPasswordRecovery = type === 'recovery'
      const isEmailVerification = type === 'signup' ||
                                 type === 'email' ||
                                 (redirect && (redirect.includes('/invite/') || redirect.includes('/auth/verify-email')))

      if (isEmailVerification) {
        // Redirect to email verification success page
        const inviteMatch = redirect?.match(/\/invite\/([^/?]+)/)
        const inviteCode = inviteMatch ? inviteMatch[1] : null

        const verifyUrl = inviteCode
          ? `${origin}/auth/verify-email?redirect=${encodeURIComponent(redirect || '')}&invite=${inviteCode}`
          : `${origin}/auth/verify-email`

        const response = NextResponse.redirect(verifyUrl)
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        return response
      }

      // Password recovery flow - redirect to reset password page
      if (isPasswordRecovery) {
        const response = NextResponse.redirect(`${origin}/reset-password`)
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        return response
      }

      // Default: redirect to dashboard or specified redirect
      const dashboardUrl = `${origin}${redirect || '/dashboard'}`
      const response = NextResponse.redirect(dashboardUrl)
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }
  }

  // Return to login with error
  const loginUrl = `${origin}/login?error=auth`
  const response = NextResponse.redirect(loginUrl)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

