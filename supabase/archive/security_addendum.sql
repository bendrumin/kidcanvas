-- KidCanvas storage hardening. Run after ios_addendum.sql / web_addendum.sql.
-- Idempotent: safe to run repeatedly.
--
-- Why: the iOS app uploads straight to Storage, so it never passes through the
-- web app's 10MB cap, magic-byte check, or family-membership check. Enforcing
-- those at the bucket and policy level covers every client, including future
-- ones, instead of trusting each app to behave.

-- 1. Size and type limits, enforced by Storage itself.
UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
WHERE id = 'artworks';

UPDATE storage.buckets
SET file_size_limit = 26214400, -- 25 MB
    allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/x-m4a']
WHERE id = 'voice-notes';

-- 2. Writes are confined to a folder named after a family the user belongs to.
--    Both clients already store objects as "{family_id}/{artwork_id}.jpg".
DROP POLICY IF EXISTS "Authenticated can upload artworks" ON storage.objects;
DROP POLICY IF EXISTS "Family members can upload artworks" ON storage.objects;
CREATE POLICY "Family members can upload artworks"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'artworks'
    AND (storage.foldername(name))[1] IN (
      SELECT family_id::text FROM family_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated can upload voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Family members can upload voice notes" ON storage.objects;
CREATE POLICY "Family members can upload voice notes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] IN (
      SELECT family_id::text FROM family_members WHERE user_id = auth.uid()
    )
  );

-- 3. Deletes follow family membership rather than who happened to upload, so a
--    co-parent removing artwork no longer leaves the file orphaned.
DROP POLICY IF EXISTS "Owners can delete their artwork files" ON storage.objects;
DROP POLICY IF EXISTS "Family members can delete artwork files" ON storage.objects;
CREATE POLICY "Family members can delete artwork files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'artworks'
    AND (storage.foldername(name))[1] IN (
      SELECT family_id::text FROM family_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can delete their voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Family members can delete voice notes" ON storage.objects;
CREATE POLICY "Family members can delete voice notes"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] IN (
      SELECT family_id::text FROM family_members WHERE user_id = auth.uid()
    )
  );

-- NOTE: both buckets remain PUBLIC-READ, so anyone holding an object URL can
-- fetch it (URLs contain two random UUIDs, so they are unguessable but not
-- access-controlled). Switching to a private bucket with signed URLs is the
-- stronger posture for a children's photo app and requires changes in both
-- clients — tracked as a follow-up, not done here.
