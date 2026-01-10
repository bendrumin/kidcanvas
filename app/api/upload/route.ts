import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { checkArtworkLimit } from '@/lib/subscription'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'
import { verifyCsrfProtection } from '@/lib/csrf-protection'
import { trackServerEvent } from '@/lib/analytics'

// Create S3 client function - reads env vars at request time (not module load time)
function createS3Client() {
  // Trim credentials to remove any accidental whitespace/newlines
  const r2Bucket = process.env.R2_BUCKET?.trim()
  const r2Endpoint = process.env.R2_ENDPOINT?.trim()
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()

  if (!r2Bucket || !r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
    console.error('Missing R2 configuration:', {
      hasBucket: !!r2Bucket,
      hasEndpoint: !!r2Endpoint,
      hasAccessKey: !!r2AccessKeyId,
      hasSecretKey: !!r2SecretAccessKey
    })
  }

  return {
    client: new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: r2AccessKeyId || '',
        secretAccessKey: r2SecretAccessKey || '',
      },
      forcePathStyle: true, // Required for R2 compatibility
    }),
    bucket: r2Bucket,
    publicUrl: process.env.R2_PUBLIC_URL?.trim()
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify authentication FIRST (before processing form data)
    const authHeader = request.headers.get('authorization')
    let user
    let authenticatedUserId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      // Mobile client (iOS) - verify token from header
      const token = authHeader.replace('Bearer ', '')
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
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

      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)

      if (tokenError || !tokenUser) {
        console.error('❌ [Upload API] Token verification error:', tokenError?.message)
        return NextResponse.json(
          { error: 'Unauthorized', details: 'Invalid or expired authentication token' },
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
    const story = formData.get('story') as string
    const createdDate = formData.get('createdDate') as string
    const userId = formData.get('userId') as string // This is UNTRUSTED - validate against authenticated user
    const description = formData.get('description') as string | null
    const tagsString = formData.get('tags') as string | null
    const momentPhoto = formData.get('momentPhoto') as File | null

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
      hasStory: !!story,
      storyLength: story?.length,
      createdDate,
      userId,
      hasMomentPhoto: !!momentPhoto
    })

    if (!file || !familyId || !childId || !story || story.trim().length < 20 || !createdDate) {
      console.error('Missing required fields:', {
        file: !!file,
        familyId: !!familyId,
        childId: !!childId,
        story: !!story,
        storyLength: story?.length,
        createdDate: !!createdDate,
        userId: !!verifiedUserId
      })

      // Track validation failure
      trackServerEvent('upload_validation_blocked', {
        validationError: 'missing_required_fields',
        storyLength: story?.length || 0,
        hasFile: !!file,
        hasStory: !!story,
        userId: verifiedUserId,
        familyId,
      })

      return NextResponse.json(
        { error: 'Missing required fields', details: 'Story is required (minimum 20 characters). All other fields are required.' },
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

    const originalKey = `artwork/${familyId}/${imageId}.${extension}`
    const thumbnailKey = `artwork/${familyId}/${imageId}_thumb.jpg`

    // Create S3 client and get R2 config (read env vars at request time)
    const { client: s3Client, bucket: r2Bucket, publicUrl: r2PublicUrl } = createS3Client()
    
    // Upload to R2
    if (!r2Bucket) {
      console.error('R2_BUCKET environment variable is not set')
      return NextResponse.json(
        { error: 'Storage configuration error', details: 'R2 bucket not configured' },
        { status: 500 }
      )
    }
    
    if (!r2PublicUrl) {
      console.error('R2_PUBLIC_URL environment variable is not set')
      return NextResponse.json(
        { error: 'Storage configuration error', details: 'R2 public URL not configured' },
        { status: 500 }
      )
    }
    
    console.log('Uploading to R2...', { 
      bucket: r2Bucket, 
      originalKey,
      thumbnailKey 
    })
    
    try {
      await Promise.all([
        s3Client.send(new PutObjectCommand({
          Bucket: r2Bucket,
          Key: originalKey,
          Body: originalBuffer,
          ContentType: 'image/jpeg',
        })),
        s3Client.send(new PutObjectCommand({
          Bucket: r2Bucket,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
        })),
      ])
      console.log('R2 upload successful')
    } catch (r2Error) {
      console.error('R2 upload failed:', r2Error)
      const errorDetails = r2Error instanceof Error ? r2Error.message : String(r2Error)
      console.error('R2 error details:', {
        bucket: r2Bucket,
        error: errorDetails
      })
      return NextResponse.json(
        { error: 'Storage upload failed', details: errorDetails },
        { status: 500 }
      )
    }

    const imageUrl = `${r2PublicUrl}/${originalKey}`
    const thumbnailUrl = `${r2PublicUrl}/${thumbnailKey}`

    // Process moment photo if provided
    let momentPhotoUrl: string | null = null
    if (momentPhoto) {
      try {
        const momentBytes = await momentPhoto.arrayBuffer()
        const momentBuffer = Buffer.from(momentBytes)

        // SECURITY: Validate moment photo file type and size
        const momentSignature = Array.from(momentBuffer.subarray(0, 4))
        const isMomentValid = Object.entries(ALLOWED_SIGNATURES).some(([_, sig]) => {
          return sig.every((byte, i) => byte === momentSignature[i])
        })

        if (!isMomentValid) {
          console.warn('Invalid moment photo format, skipping')
          return // Skip moment photo if invalid
        }

        if (momentBuffer.length > MAX_FILE_SIZE) {
          console.warn('Moment photo too large, skipping')
          return // Skip moment photo if too large
        }

        // Process moment photo with sharp
        const momentImageId = uuidv4()
        const momentProcessed = await sharp(momentBuffer)
          .rotate()
          .jpeg({ quality: 90 })
          .toBuffer()
        
        const momentKey = `artwork/${familyId}/${momentImageId}_moment.jpg`
        
        await s3Client.send(new PutObjectCommand({
          Bucket: r2Bucket,
          Key: momentKey,
          Body: momentProcessed,
          ContentType: 'image/jpeg',
        }))
        
        momentPhotoUrl = `${r2PublicUrl}/${momentKey}`
        console.log('Moment photo uploaded:', momentPhotoUrl)
      } catch (momentError) {
        console.error('Failed to upload moment photo:', momentError)
        // Don't fail the entire upload if moment photo fails
      }
    }

    // Save to database
    const supabase = await createServiceClient()
    
    // Use provided title or generate from story (first 50 chars)
    const artworkTitle = title?.trim() || story.trim().substring(0, 50) || 'Untitled Artwork'
    
    const insertData: {
      family_id: string
      child_id: string
      image_url: string
      thumbnail_url: string
      title: string
      story: string
      moment_photo_url: string | null
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
      story: story.trim(),
      moment_photo_url: momentPhotoUrl,
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
      storyLength: insertData.story.length,
      hasMomentPhoto: !!insertData.moment_photo_url,
      hasDescription: !!insertData.description
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

    // NOTE: AI tagging is now manual - removed automatic tagging to reduce CPU usage
    // Users can trigger AI tagging from the artwork detail page

    // Track successful upload
    if (data) {
      trackServerEvent('upload_completed', {
        artworkId: data.id,
        userId: verifiedUserId,
        familyId,
        storyLength: story.trim().length,
        hasMomentPhoto: !!momentPhotoUrl,
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

