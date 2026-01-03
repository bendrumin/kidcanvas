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
      const { data: { user } } = await supabase.auth.getUser()
      
      // Check if this is an email verification (not OAuth)
      // Email verification links from Supabase typically have:
      // - type=signup (new user signup)
      // - type=email (email change)  
      // - redirect includes /invite/ (invite flow)
      // - redirect includes /auth/verify-email (already going to verify page)
      // - No OAuth provider (email signup, not Google/GitHub/etc)
      const hasOAuthProvider = user?.app_metadata?.provider && 
                              user.app_metadata.provider !== 'email' &&
                              user.app_metadata.provider !== 'phone'
      
      // More aggressive detection: if it's not OAuth and not a password recovery, treat as email verification
      const isPasswordRecovery = type === 'recovery'
      const isEmailVerification = type === 'signup' || 
                                 type === 'email' || 
                                 (redirect && (redirect.includes('/invite/') || redirect.includes('/auth/verify-email'))) ||
                                 (!hasOAuthProvider && !isPasswordRecovery)
      
      if (isEmailVerification) {
        // Redirect to email verification success page
        // Check if there's an invite code in the redirect
        const inviteMatch = redirect?.match(/\/invite\/([^/?]+)/)
        const inviteCode = inviteMatch ? inviteMatch[1] : null
        
        // Build redirect URL with no-cache headers
        const verifyUrl = inviteCode 
          ? `${origin}/auth/verify-email?redirect=${encodeURIComponent(redirect || '')}&invite=${inviteCode}`
          : `${origin}/auth/verify-email`
        
        const response = NextResponse.redirect(verifyUrl)
        // Prevent caching
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        return response
      }
      
      // OAuth flow - check if user has a family, if not create one
      if (user) {
        // Check for existing family membership
        const { data: membership } = await supabase
          .from('family_members')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        // If no family, create one
        if (!membership) {
          // Extract name from OAuth providers or user metadata
          const fullName = user.user_metadata?.full_name || 
                          user.user_metadata?.name ||
                          user.user_metadata?.display_name ||
                          user.email?.split('@')[0] || 
                          'My'
          
          const familyName = user.user_metadata?.family_name || 
                            `${fullName.split(' ')[0]}'s Family`
          
          // Update user metadata if we got name from OAuth
          if (!user.user_metadata?.full_name && fullName !== 'My') {
            await supabase.auth.updateUser({
              data: {
                full_name: fullName,
                family_name: familyName,
              },
            })
          }
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc('create_family_for_user', {
            family_name: familyName,
          })
        }
      }
      
      const dashboardUrl = `${origin}${redirect || '/dashboard'}`
      const response = NextResponse.redirect(dashboardUrl)
      // Prevent caching
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

