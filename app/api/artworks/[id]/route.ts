import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import type { Database } from '@/lib/supabase/types'

// Create S3 client function for R2
function createS3Client() {
  const r2Bucket = process.env.R2_BUCKET?.trim()
  const r2Endpoint = process.env.R2_ENDPOINT?.trim()
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()

  if (!r2Bucket || !r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
    console.error('Missing R2 configuration')
    return null
  }

  return {
    client: new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
      forcePathStyle: true, // Required for R2 compatibility
    }),
    bucket: r2Bucket,
  }
}

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
    const { data: artwork, error: artworkError } = await (supabase
      .from('artworks') as any)
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
    const { data: membership } = await (supabase
      .from('family_members') as any)
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

    // Extract R2 keys from image URLs
    // URL format: https://pub-xxx.r2.dev/artwork/{familyId}/{imageId}.jpg
    const extractR2Key = (url: string): string | null => {
      try {
        const urlObj = new URL(url)
        // Remove leading slash from pathname
        return urlObj.pathname.substring(1)
      } catch {
        return null
      }
    }

    const imageKey = extractR2Key(artwork.image_url)
    const thumbnailKey = extractR2Key(artwork.thumbnail_url)

    // Delete from database first (if this fails, we haven't deleted files yet)
    const { error: deleteError } = await (supabase
      .from('artworks') as any)
      .delete()
      .eq('id', artworkId)

    if (deleteError) {
      console.error('❌ [Delete API] Failed to delete artwork from database:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete artwork' },
        { status: 500 }
      )
    }

    // Delete files from R2 (best effort - don't fail if this doesn't work)
    if (imageKey || thumbnailKey) {
      const s3Config = createS3Client()
      if (s3Config) {
        try {
          const deletePromises: Promise<unknown>[] = []
          
          if (imageKey) {
            deletePromises.push(
              s3Config.client.send(new DeleteObjectCommand({
                Bucket: s3Config.bucket,
                Key: imageKey,
              }))
            )
          }
          
          if (thumbnailKey) {
            deletePromises.push(
              s3Config.client.send(new DeleteObjectCommand({
                Bucket: s3Config.bucket,
                Key: thumbnailKey,
              }))
            )
          }

          await Promise.all(deletePromises)
          console.log('✅ [Delete API] Files deleted from R2')
        } catch (r2Error) {
          // Log but don't fail - artwork is already deleted from database
          console.error('⚠️ [Delete API] Failed to delete files from R2 (non-critical):', r2Error)
        }
      }
    }

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
