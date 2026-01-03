import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    // Check for Bearer token in Authorization header (for iOS/mobile clients)
    const authHeader = request.headers.get('authorization')
    let supabase = await createClient()
    let user

    if (authHeader?.startsWith('Bearer ')) {
      // Mobile client - verify token from header
      const token = authHeader.replace('Bearer ', '')
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const supabaseWithToken = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      )
      // getUser() will use the token from the Authorization header
      const { data: { user: tokenUser }, error: tokenError } = await supabaseWithToken.auth.getUser()
      if (tokenError) {
        console.error('Token verification error:', tokenError)
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      user = tokenUser
    } else {
      // Web client - use cookies
      const { data: { user: cookieUser } } = await supabase.auth.getUser()
      user = cookieUser
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { artworkId, familyId, type = 'artwork' } = body

    let targetFamilyId: string

    if (type === 'gallery' || type === 'family') {
      // Gallery/family share
      if (!familyId) {
        return NextResponse.json({ error: 'Family ID required for gallery share' }, { status: 400 })
      }

      // Check family membership
      const { data: membership } = await (supabase
        .from('family_members') as any)
        .select('id')
        .eq('family_id', familyId)
        .eq('user_id', user.id)
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }

      targetFamilyId = familyId
    } else {
      // Artwork share
      if (!artworkId) {
        return NextResponse.json({ error: 'Artwork ID required' }, { status: 400 })
      }

      // Verify user has access to this artwork
      const { data: artwork } = await (supabase
        .from('artworks') as any)
        .select('family_id')
        .eq('id', artworkId)
        .single() as { data: { family_id: string } | null }

      if (!artwork) {
        return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
      }

      // Check family membership
      const { data: membership } = await (supabase
        .from('family_members') as any)
        .select('id')
        .eq('family_id', artwork.family_id)
        .eq('user_id', user.id)
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }

      targetFamilyId = artwork.family_id
    }

    const resourceId = type === 'gallery' || type === 'family' ? familyId : artworkId

    // Check if share link already exists
    const { data: existingLink } = await (supabase
      .from('share_links') as any)
      .select('code')
      .eq('resource_id', resourceId)
      .eq('type', type === 'gallery' ? 'collection' : type) // Use 'collection' type for gallery shares
      .single()

    if (existingLink) {
      return NextResponse.json({ 
        code: existingLink.code,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${existingLink.code}`
      })
    }

    // Create new share link
    const code = nanoid(10)
    
    const { error } = await (supabase
      .from('share_links') as any)
      .insert({
        family_id: targetFamilyId,
        code,
        type: type === 'gallery' ? 'collection' : type, // Store as 'collection' type for gallery
        resource_id: resourceId,
        created_by: user.id,
      })

    if (error) {
      console.error('Share link error:', error)
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
    }

    return NextResponse.json({ 
      code,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${code}`
    })
  } catch (error) {
    console.error('Share error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

