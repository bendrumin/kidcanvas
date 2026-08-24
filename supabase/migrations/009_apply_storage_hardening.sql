-- security_addendum.sql was never actually run against this project.
--
-- Verified live before this migration: the artworks bucket had
-- file_size_limit = NULL and allowed_mime_types = NULL, the INSERT policy was
-- the original "Authenticated can upload artworks" with
-- WITH CHECK (bucket_id = 'artworks') and no folder restriction, and DELETE was
-- still the uploader-scoped "Owners can delete their artwork files". So any
-- signed-in user -- sign-up is open -- could upload a file of any type and any
-- size into any family's folder. docs/SECURITY.md listed all three of these as
-- "Fixed"; the database disagreed.
--
-- This applies what security_addendum.sql intended. Both clients already key
-- objects as "{family_id}/{artwork_id}.ext" (iOS UploadSheetView, web
-- app/api/upload/route.ts), so the folder check matches existing uploads.
--
-- The voice-notes bucket does not exist in this project, so its policies are
-- omitted here. Migration 008's voice-notes SELECT policy is inert but correct
-- if that bucket is ever created.

UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10 MB, matching the web route's own cap
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
WHERE id = 'artworks';

-- Writes confined to a folder named after a family the user belongs to.
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

-- Deletes follow family membership rather than who happened to upload, so a
-- co-parent removing artwork no longer leaves the file orphaned.
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
