import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { uploadToStorage, ARTWORK_BUCKET } from '@/lib/storage'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { checkArtworkLimit } from '@/lib/subscription'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'
import { verifyCsrfProtection } from '@/lib/csrf-protection'
import { trackServerEvent } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify authentication FIRST (before processing form data)
    // Note: Next.js normalizes headers to lowercase
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    let user
    let authenticatedUserId: string | null = null
    const authenticatedViaToken = !!authHeader?.startsWith('Bearer ')

    console.log('🔵 [Upload API] Checking authentication...')
    console.log('  - Has authorization header (lowercase):', !!request.headers.get('authorization'))
    console.log('  - Has Authorization header (uppercase):', !!request.headers.get('Authorization'))
    console.log('  - Final authHeader value:', authHeader ? `${authHeader.substring(0, 20)}...` : 'none')
    console.log('  - All headers:', JSON.stringify(Array.from(request.headers.entries())))

    if (authHeader?.startsWith('Bearer ')) {
      // Mobile client (iOS) - verify token from header
      const token = authHeader.replace('Bearer ', '')
      console.log('🔵 [Upload API] Verifying Bearer token (first 20 chars):', token.substring(0, 20))

      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')

      // Log environment variable status
      console.log('🔵 [Upload API] Environment check:', {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      })

      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      console.log('🔵 [Upload API] Calling getUser with token...')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      console.log('🔵 [Upload API] getUser result:', {
        hasUser: !!tokenUser,
        userId: tokenUser?.id,
        hasError: !!tokenError,
        errorMessage: tokenError?.message,
        errorCode: tokenError?.code
      })

      if (tokenError || !tokenUser) {
        console.error('❌ [Upload API] Token verification error:', {
          message: tokenError?.message,
          code: tokenError?.code,
          status: tokenError?.status
        })
        return NextResponse.json(
          { error: 'Unauthorized', details: `Invalid or expired authentication token: ${tokenError?.message || 'Unknown error'}` },
          { status: 401 }
        )
      }

      user = tokenUser
      authenticatedUserId = tokenUser.id
      console.log('✅ [Upload API] Token verified successfully, user ID:', authenticatedUserId)
    } else {
      // Web client - use cookies
      const supabase = await createClient()
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !cookieUser) {
        console.error('❌ [Upload API] Cookie authentication error:', authError?.message)
        return NextResponse.json(
          { error: 'Unauthorized', details: 'Authentication required' },
          { status: 401 }
        )
      }

      user = cookieUser
      authenticatedUserId = cookieUser.id
      console.log('✅ [Upload API] Cookie authentication verified, user ID:', authenticatedUserId)
    }

    if (!user || !authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Authentication required' },
        { status: 401 }
      )
    }

    // SECURITY: CSRF protection (for web clients only, mobile clients have token auth)
    const csrfCheck = verifyCsrfProtection(request)
    if (!csrfCheck.success && !authHeader?.startsWith('Bearer ')) {
      console.warn('CSRF check failed:', csrfCheck.error)
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      )
    }

    const formData = await request.formData()

    const file = formData.get('file') as File
    const familyId = formData.get('familyId') as string
    const childId = formData.get('childId') as string
    const title = formData.get('title') as string | null
    const createdDate = formData.get('createdDate') as string
    const userId = formData.get('userId') as string // This is UNTRUSTED - validate against authenticated user
    const description = formData.get('description') as string | null
    const tagsString = formData.get('tags') as string | null

    // SECURITY: Validate userId from form data matches authenticated user
    // This prevents users from uploading on behalf of other users
    if (userId && userId !== authenticatedUserId) {
      console.error('❌ [Upload API] User ID mismatch:', {
        authenticated: authenticatedUserId,
        provided: userId
      })
      return NextResponse.json(
        { error: 'Forbidden', details: 'Cannot upload artwork for another user' },
        { status: 403 }
      )
    }

    // Use authenticated user ID (ignore form data userId for security)
    const verifiedUserId = authenticatedUserId

    // SECURITY: Rate limiting (use verified user ID)
    const identifier = getClientIdentifier(request, verifiedUserId)
    const rateLimit = checkRateLimit(identifier, 'upload')

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: `Too many upload requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          }
        }
      )
    }

    console.log('Upload request received:', {
      hasFile: !!file,
      fileSize: file?.size,
      fileType: file?.type,
      familyId,
      childId,
      title,
      createdDate,
      userId
    })

    if (!file || !familyId || !childId || !createdDate) {
      console.error('Missing required fields:', {
        file: !!file,
        familyId: !!familyId,
        childId: !!childId,
        createdDate: !!createdDate,
        userId: !!verifiedUserId
      })

      // Track validation failure
      trackServerEvent('upload_validation_blocked', {
        validationError: 'missing_required_fields',
        hasFile: !!file,
        userId: verifiedUserId,
        familyId,
      })

      return NextResponse.json(
        { error: 'Missing required fields', details: 'File, family, child, and date are required.' },
        { status: 400 }
      )
    }

    // Check artwork limit before processing (use verified user ID)
    const limitCheck = await checkArtworkLimit(verifiedUserId, familyId)
    if (!limitCheck.allowed) {
      // Track limit reached
      trackServerEvent('upload_validation_blocked', {
        validationError: 'limit_reached',
        currentLimit: limitCheck.limit,
        currentUsage: limitCheck.current,
        userId: verifiedUserId,
        familyId,
      })

      return NextResponse.json(
        {
          error: 'Artwork limit reached',
          details: limitCheck.message || `You've reached the limit of ${limitCheck.limit} artworks. Upgrade to upload more!`,
          limitReached: true,
          limit: limitCheck.limit,
          current: limitCheck.current
        },
        { status: 403 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // SECURITY: Validate file type using magic numbers (file signatures)
    const ALLOWED_SIGNATURES: { [key: string]: number[] } = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
    }

    // Check file signature (first 4 bytes)
    const signature = Array.from(buffer.slice(0, 4))
    const isValidImage = Object.entries(ALLOWED_SIGNATURES).some(([mime, sig]) => {
      return sig.every((byte, i) => byte === signature[i])
    })

    if (!isValidImage) {
      return NextResponse.json(
        { error: 'Invalid file type', details: 'Only JPEG, PNG, and WebP images are allowed' },
        { status: 400 }
      )
    }

    // SECURITY: Enforce file size limit (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large', details: 'Maximum file size is 10MB' },
        { status: 413 }
      )
    }

    // Process images with sharp
    const imageId = uuidv4()
    const extension = file.type.includes('png') ? 'png' : 'jpg'
    
    // Original image (optimized)
    const originalBuffer = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .jpeg({ quality: 90 })
      .toBuffer()

    // Thumbnail
    const thumbnailBuffer = await sharp(buffer)
      .rotate()
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()

    // Paths match what the iOS app writes, so both clients share one layout.
    const originalKey = `${familyId}/${imageId}.${extension}`
    const thumbnailKey = `${familyId}/${imageId}_thumb.jpg`

    // The caller's own session authorizes the upload, so no storage
    // credentials are needed; RLS on the bucket does the gatekeeping.
    const storageClient = await createClient()

    let imageUrl: string
    let thumbnailUrl: string
    try {
      ;[imageUrl, thumbnailUrl] = await Promise.all([
        uploadToStorage(storageClient, ARTWORK_BUCKET, originalKey, originalBuffer, 'image/jpeg'),
        uploadToStorage(storageClient, ARTWORK_BUCKET, thumbnailKey, thumbnailBuffer, 'image/jpeg'),
      ])
    } catch (storageError) {
      const errorDetails = storageError instanceof Error ? storageError.message : String(storageError)
      console.error('Storage upload failed:', errorDetails)
      return NextResponse.json(
        { error: 'Storage upload failed', details: errorDetails },
        { status: 500 }
      )
    }

    // Save to database. The session client is enough — RLS lets family members
    // insert — so a service-role key is only needed for the mobile Bearer path.
    // The two clients carry different generics, so a union of them isn't
    // callable; the insert shape is asserted on the result below.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = authenticatedViaToken ? await createServiceClient() : storageClient

    // Use provided title or default
    const artworkTitle = title?.trim() || 'Untitled Artwork'

    const insertData: {
      family_id: string
      child_id: string
      image_url: string
      thumbnail_url: string
      title: string
      created_date: string
      uploaded_by: string
      description?: string
      tags?: string[]
    } = {
      family_id: familyId,
      child_id: childId,
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      title: artworkTitle,
      created_date: createdDate,
      uploaded_by: verifiedUserId, // Use verified user ID, not form data
    }
    
    // Add description if provided (legacy field, might be used by AI)
    if (description && description.trim()) {
      insertData.description = description.trim()
    }
    
    // Add tags if provided
    if (tagsString && tagsString.trim()) {
      insertData.tags = tagsString.split(',').map(t => t.trim()).filter(Boolean)
    }
    
    console.log('Inserting artwork to database:', {
      family_id: insertData.family_id,
      child_id: insertData.child_id,
      title: insertData.title,
      hasDescription: !!insertData.description,
      hasTags: !!insertData.tags
    })
    
    const { data, error } = await supabase
      .from('artworks')
      .insert(insertData)
      .select()
      .single() as { data: { id: string } | null; error: unknown }

    if (error) {
      console.error('Database error:', error)
      console.error('Failed insert data:', insertData)
      return NextResponse.json(
        { error: 'Failed to save artwork', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    }

    // Track successful upload
    if (data) {
      trackServerEvent('upload_completed', {
        artworkId: data.id,
        userId: verifiedUserId,
        familyId,
        hasTags: !!(tagsString && tagsString.trim()),
        hasTitle: !!(title && title.trim()),
        fileSize: buffer.length,
      })
    }

    return NextResponse.json({ success: true, artwork: data })
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error stack:', errorStack)
    return NextResponse.json(
      { error: 'Upload failed', details: errorMessage },
      { status: 500 }
    )
  }
}

// Route segment config for Next.js App Router
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max for upload + image processing

