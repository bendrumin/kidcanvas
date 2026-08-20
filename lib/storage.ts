/**
 * File storage on Supabase Storage.
 *
 * Replaces the old Cloudflare R2 backend so the web app and the iOS app read
 * and write the same buckets, and the app needs no S3 credentials at all —
 * uploads are authorized by the caller's own Supabase session.
 */
export const ARTWORK_BUCKET = 'artworks'
export const VOICE_BUCKET = 'voice-notes'

/**
 * Just the storage surface these helpers touch. Structural typing keeps them
 * usable with both the cookie-session client (typed with Database) and the
 * service-role client, whose generics are otherwise incompatible.
 */
type StorageClient = {
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        body: Buffer | Uint8Array,
        options?: { contentType?: string; upsert?: boolean }
      ): Promise<{ error: { message: string } | null }>
      getPublicUrl(path: string): { data: { publicUrl: string } }
      remove(paths: string[]): Promise<{ error: { message: string } | null }>
    }
  }
}

/** Uploads a file and returns its public URL. */
export async function uploadToStorage(
  supabase: StorageClient,
  bucket: string,
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(key, body, {
    contentType,
    upsert: true,
  })

  if (error) {
    throw new Error(`Storage upload failed for ${bucket}/${key}: ${error.message}`)
  }

  return supabase.storage.from(bucket).getPublicUrl(key).data.publicUrl
}

/**
 * Turns a public storage URL back into its object key, or null when the URL
 * points somewhere else (e.g. artwork still hosted on the retired R2 bucket).
 */
export function storageKeyFromUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + marker.length))
}

/** Best-effort delete; missing or foreign files are ignored. */
export async function deleteFromStorage(
  supabase: StorageClient,
  bucket: string,
  urlsOrKeys: string[]
): Promise<void> {
  const keys = urlsOrKeys
    .map((value) => (value.startsWith('http') ? storageKeyFromUrl(value, bucket) : value))
    .filter((key): key is string => !!key)

  if (keys.length === 0) return

  const { error } = await supabase.storage.from(bucket).remove(keys)
  if (error) {
    console.error(`Storage delete failed for ${bucket}:`, error.message)
  }
}
