import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const familyId = formData.get('familyId') as string
    const childId = formData.get('childId') as string
    const title = formData.get('title') as string
    const createdDate = formData.get('createdDate') as string
    const userId = formData.get('userId') as string

    if (!file || !familyId || !childId || !title || !createdDate || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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

    // Upload to R2
    await Promise.all([
      s3Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: originalKey,
        Body: originalBuffer,
        ContentType: 'image/jpeg',
      })),
      s3Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
      })),
    ])

    const imageUrl = `${process.env.R2_PUBLIC_URL}/${originalKey}`
    const thumbnailUrl = `${process.env.R2_PUBLIC_URL}/${thumbnailKey}`

    // Save to database
    const supabase = await createServiceClient()
    
    const { data, error } = await supabase
      .from('artworks')
      .insert({
        family_id: familyId,
        child_id: childId,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        title,
        created_date: createdDate,
        uploaded_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save artwork' },
        { status: 500 }
      )
    }

    // Trigger AI tagging in background (optional)
    if (process.env.ANTHROPIC_API_KEY) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai-tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: data.id, imageUrl }),
      }).catch(console.error) // Fire and forget
    }

    return NextResponse.json({ success: true, artwork: data })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

