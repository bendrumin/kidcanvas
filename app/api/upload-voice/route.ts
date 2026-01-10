import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

// Create S3 client function
function createS3Client() {
  const r2Bucket = process.env.R2_BUCKET?.trim()
  const r2Endpoint = process.env.R2_ENDPOINT?.trim()
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()

  if (!r2Bucket || !r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
    console.error('Missing R2 configuration')
  }

  return {
    client: new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: r2AccessKeyId || '',
        secretAccessKey: r2SecretAccessKey || '',
      },
      forcePathStyle: true,
    }),
    bucket: r2Bucket,
    publicUrl: process.env.R2_PUBLIC_URL?.trim()
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const audioFile = formData.get('audio') as File
    const artworkId = formData.get('artworkId') as string
    const familyId = formData.get('familyId') as string
    const userId = formData.get('userId') as string
    const durationSeconds = formData.get('duration') as string

    console.log('Voice upload request:', {
      hasAudio: !!audioFile,
      audioSize: audioFile?.size,
      audioType: audioFile?.type,
      artworkId,
      familyId,
      userId,
      duration: durationSeconds
    })

    if (!audioFile || !artworkId || !familyId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 1. VERIFY AUTHENTICATION
    const userSupabase = await createClient()
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify userId matches authenticated user
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - User ID mismatch' },
        { status: 403 }
      )
    }

    // SECURITY: Rate limiting for voice uploads
    const identifier = getClientIdentifier(request, user.id)
    const rateLimit = checkRateLimit(identifier, 'voice')

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: `Too many voice upload requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
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

    // 2. VERIFY USER HAS ACCESS TO THIS ARTWORK
    const supabase = await createServiceClient()
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select('id, family_id')
      .eq('id', artworkId)
      .single() as { data: { id: string; family_id: string } | null; error: unknown }

    if (artworkError || !artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }

    if (artwork.family_id !== familyId) {
      return NextResponse.json(
        { error: 'Forbidden - Family ID mismatch' },
        { status: 403 }
      )
    }

    // 3. VERIFY USER IS A MEMBER OF THE FAMILY
    const { data: membership, error: membershipError } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('user_id', userId)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Forbidden - You are not a member of this family' },
        { status: 403 }
      )
    }

    // Convert file to buffer
    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine file extension from MIME type
    let extension = 'webm'
    if (audioFile.type.includes('mp4')) extension = 'mp4'
    if (audioFile.type.includes('mpeg')) extension = 'mp3'
    if (audioFile.type.includes('wav')) extension = 'wav'

    const audioId = uuidv4()
    const audioKey = `voice/${familyId}/${audioId}.${extension}`

    // Upload to R2
    const { client: s3Client, bucket: r2Bucket, publicUrl: r2PublicUrl } = createS3Client()

    if (!r2Bucket || !r2PublicUrl) {
      return NextResponse.json(
        { error: 'Storage configuration error' },
        { status: 500 }
      )
    }

    console.log('Uploading voice note to R2:', audioKey)

    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: r2Bucket,
        Key: audioKey,
        Body: buffer,
        ContentType: audioFile.type,
      }))
      console.log('Voice note upload successful')
    } catch (r2Error) {
      console.error('R2 upload failed:', r2Error)
      return NextResponse.json(
        { error: 'Storage upload failed' },
        { status: 500 }
      )
    }

    const voiceUrl = `${r2PublicUrl}/${audioKey}`

    // Update artwork with voice note URL and duration
    const { error: updateError } = await supabase
      .from('artworks')
      .update({
        voice_note_url: voiceUrl,
        voice_duration_seconds: durationSeconds ? parseInt(durationSeconds) : null,
        voice_uploaded_at: new Date().toISOString()
      })
      .eq('id', artworkId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to save voice note' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      voiceUrl,
      duration: durationSeconds ? parseInt(durationSeconds) : null
    })
  } catch (error) {
    console.error('Voice upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
