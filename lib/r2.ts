import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
  
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    })
  )
}

export function getR2KeyFromUrl(url: string): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL
  if (!publicUrl || !url.startsWith(publicUrl)) {
    return null
  }
  return url.replace(`${publicUrl}/`, '')
}

