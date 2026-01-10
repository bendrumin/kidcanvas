import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: artworkId } = await params

    // SECURITY: Verify authentication
    const authHeader = request.headers.get('authorization')
    let user

    if (authHeader?.startsWith('Bearer ')) {
      // Mobile client (iOS) - verify token from header
      const token = authHeader.replace('Bearer ', '')
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)

      if (tokenError || !tokenUser) {
        console.error('❌ [Favorite API] Token verification error:', tokenError?.message)
        return NextResponse.json(
          { error: 'Unauthorized', details: 'Invalid or expired authentication token' },
          { status: 401 }
        )
      }

      user = tokenUser
    } else {
      // Web client - use cookies
      const supabase = await createClient()
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !cookieUser) {
        console.error('❌ [Favorite API] Cookie authentication error:', authError?.message)
        return NextResponse.json(
          { error: 'Unauthorized', details: 'Authentication required' },
          { status: 401 }
        )
      }

      user = cookieUser
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Authentication required' },
        { status: 401 }
      )
    }

    // SECURITY: Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(artworkId)) {
      return NextResponse.json(
        { error: 'Invalid artwork ID format' },
        { status: 400 }
      )
    }

    // Get the appropriate Supabase client based on auth method
    let supabase: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof import('@supabase/supabase-js').createClient>
    
    if (authHeader?.startsWith('Bearer ')) {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      supabase = createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      ) as any
    } else {
      supabase = await createClient()
    }

    // SECURITY: Verify user has access to this artwork by checking family membership
    const { data: artwork, error: artworkError } = await (supabase
      .from('artworks') as any)
      .select('id, family_id, is_favorite')
      .eq('id', artworkId)
      .single() as { data: { id: string; family_id: string; is_favorite: boolean } | null; error: unknown }

    if (artworkError || !artwork) {
      console.error('❌ [Favorite API] Artwork not found:', artworkError)
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }

    // Check family membership
    const { data: membership } = await (supabase
      .from('family_members') as any)
      .select('id')
      .eq('family_id', artwork.family_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      console.error('❌ [Favorite API] User not authorized to access artwork')
      return NextResponse.json(
        { error: 'Forbidden', details: 'You do not have access to this artwork' },
        { status: 403 }
      )
    }

    // Toggle favorite status
    const newFavoriteStatus = !artwork.is_favorite

    const { data: updatedArtwork, error: updateError } = await (supabase
      .from('artworks') as any)
      .update({ is_favorite: newFavoriteStatus })
      .eq('id', artworkId)
      .select('id, is_favorite')
      .single() as { data: { id: string; is_favorite: boolean } | null; error: unknown }

    if (updateError || !updatedArtwork) {
      console.error('❌ [Favorite API] Failed to update favorite:', updateError)
      return NextResponse.json(
        { error: 'Failed to update favorite status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      artwork: {
        id: updatedArtwork.id,
        is_favorite: updatedArtwork.is_favorite
      }
    })
  } catch (error) {
    console.error('❌ [Favorite API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

// Route segment config
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
