import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { checkArtworkLimit } from '@/lib/subscription'

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
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const familyId = formData.get('familyId') as string
    const childId = formData.get('childId') as string
    const title = formData.get('title') as string
    const createdDate = formData.get('createdDate') as string
    const userId = formData.get('userId') as string
    const description = formData.get('description') as string | null
    const tagsString = formData.get('tags') as string | null

    console.log('Upload request received:', {
      hasFile: !!file,
      fileSize: file?.size,
      fileType: file?.type,
      familyId,
      childId,
      title,
      createdDate,
      userId,
      hasDescription: !!description
    })

    if (!file || !familyId || !childId || !title || !createdDate || !userId) {
      console.error('Missing required fields:', {
        file: !!file,
        familyId: !!familyId,
        childId: !!childId,
        title: !!title,
        createdDate: !!createdDate,
        userId: !!userId
      })
      return NextResponse.json(
        { error: 'Missing required fields', details: 'One or more required fields are missing' },
        { status: 400 }
      )
    }

    // Check artwork limit before processing
    const limitCheck = await checkArtworkLimit(userId, familyId)
    if (!limitCheck.allowed) {
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

    // Save to database
    const supabase = await createServiceClient()
    
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
      title,
      created_date: createdDate,
      uploaded_by: userId,
    }
    
    // Add description if provided (requires migration 003_add_description_to_artworks.sql)
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

    // Trigger AI tagging in background (optional)
    if (process.env.ANTHROPIC_API_KEY && data) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai-tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: data.id, imageUrl }),
      }).catch(console.error) // Fire and forget
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

