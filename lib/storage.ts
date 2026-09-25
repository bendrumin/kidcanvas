/**
 * File storage on Supabase Storage.
 *
 * Replaces the old Cloudflare R2 backend so the web app and the iOS app read
 * and write the same buckets, and the app needs no S3 credentials at all —
 * uploads are authorized by the caller's own Supabase session.
 */
export const ARTWORK_BUCKET = 'artworks'

/**
 * Private bucket (migration 013): nothing in it has a public address. Reads go
 * through RLS and play from short-lived signed URLs, because a recording of a
 * child's voice is more sensitive than a picture of their drawing.
 */
export const VOICE_BUCKET = 'voice-notes'

/**
 * The only key a voice note may have. The database CHECK and the upload
 * policy both insist on it, so cleanup can derive the key from an artwork's
 * ids instead of trusting a stored value. Postgres renders uuids in lowercase.
 */
export function voiceNoteKey(familyId: string, artworkId: string): string {
  return `${familyId.toLowerCase()}/${artworkId.toLowerCase()}.m4a`
}

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

type FolderClient = {
  storage: {
    from(bucket: string): {
      list(
        path: string,
        options?: { limit?: number; offset?: number }
      ): Promise<{ data: { name: string }[] | null; error: { message: string } | null }>
      remove(paths: string[]): Promise<{ error: { message: string } | null }>
    }
  }
}

/**
 * Empties one family's folder in a bucket. Row deletes cascade in Postgres but
 * never reach storage, so whole-family deletion has to clear files itself.
 * Pages through the listing because list() returns at most `limit` names.
 */
export async function removeStorageFolder(
  supabase: FolderClient,
  bucket: string,
  folder: string
): Promise<void> {
  const bucketApi = supabase.storage.from(bucket)
  const pageSize = 100

  // Removing shrinks the listing, so always read from offset 0 until empty.
  // The guard stops a remove that keeps failing from looping forever.
  for (let attempt = 0; attempt < 1000; attempt++) {
    const { data, error } = await bucketApi.list(folder, { limit: pageSize })
    if (error) {
      console.error(`Storage list failed for ${bucket}/${folder}:`, error.message)
      return
    }
    if (!data || data.length === 0) return

    const { error: removeError } = await bucketApi.remove(data.map((file) => `${folder}/${file.name}`))
    if (removeError) {
      console.error(`Storage folder delete failed for ${bucket}/${folder}:`, removeError.message)
      return
    }
    if (data.length < pageSize) return
  }
}
