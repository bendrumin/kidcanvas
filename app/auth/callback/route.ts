import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user has a family, if not create one
      const { data: { user } } = await supabase.auth.getUser()
      
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
      
      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`)
}

