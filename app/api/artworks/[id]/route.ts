import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteFromStorage, ARTWORK_BUCKET } from '@/lib/storage'
import type { Database } from '@/lib/supabase/types'

export async function DELETE(
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
        console.error('❌ [Delete API] Token verification error:', tokenError?.message)
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
        console.error('❌ [Delete API] Cookie authentication error:', authError?.message)
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

    // SECURITY: Verify user has access to this artwork and permission to delete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: artwork, error: artworkError } = await (supabase as any)
      .from('artworks')
      .select('id, family_id, image_url, thumbnail_url, uploaded_by')
      .eq('id', artworkId)
      .single() as { data: { id: string; family_id: string; image_url: string; thumbnail_url: string; uploaded_by: string } | null; error: unknown }

    if (artworkError || !artwork) {
      console.error('❌ [Delete API] Artwork not found:', artworkError)
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }

    // Check family membership and role (only owners/parents can delete)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase as any)
      .from('family_members')
      .select('role')
      .eq('family_id', artwork.family_id)
      .eq('user_id', user.id)
      .single() as { data: { role: string } | null }

    if (!membership) {
      console.error('❌ [Delete API] User not authorized to access artwork')
      return NextResponse.json(
        { error: 'Forbidden', details: 'You do not have access to this artwork' },
        { status: 403 }
      )
    }

    // Only owners and parents can delete artworks
    if (membership.role !== 'owner' && membership.role !== 'parent') {
      console.error('❌ [Delete API] User does not have permission to delete')
      return NextResponse.json(
        { error: 'Forbidden', details: 'Only owners and parents can delete artworks' },
        { status: 403 }
      )
    }

    // Delete from database first (if this fails, we haven't deleted files yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('artworks')
      .delete()
      .eq('id', artworkId)

    if (deleteError) {
      console.error('❌ [Delete API] Failed to delete artwork from database:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete artwork' },
        { status: 500 }
      )
    }

    // Best effort: the row is already gone, so a failure here only orphans a
    // file. URLs from the retired R2 bucket simply don't match and are skipped.
    await deleteFromStorage(supabase, ARTWORK_BUCKET, [
      artwork.image_url,
      artwork.thumbnail_url,
    ].filter(Boolean))

    return NextResponse.json({
      success: true,
      message: 'Artwork deleted successfully'
    })
  } catch (error) {
    console.error('❌ [Delete API] Error:', error)
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
