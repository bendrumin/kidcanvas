-- Voice notes, rebuilt: the child telling the story in their own voice.
--
-- 010 dropped voice_note_url and friends because nothing could record and the
-- bucket never existed. This is the from-scratch version, and it is private
-- from the first byte, because a recording of a child's voice is more
-- sensitive than a picture they drew.
--
-- How it differs from the artworks bucket (008/009):
--
--   * The bucket is PRIVATE. Artwork images are public-read and rely on
--     unlisted, unguessable addresses; that was a compromise forced by shipped
--     clients rendering stored public URLs. Voice notes have no shipped
--     clients, so there is nothing to stay compatible with. Every read goes
--     through RLS, and clients play audio from short-lived signed URLs that
--     only a signed-in family member can mint.
--
--   * The row stores an object KEY, not a URL. There is no permanent address
--     to store, and a key cannot leak into a share link or a log as something
--     that plays on its own.
--
--   * The key is not free text. It must be exactly
--     "{family_id}/{artwork_id}.m4a" for the row it sits on (CHECK below), and
--     uploads are only accepted at a key whose artwork exists in a family where
--     the uploader is an owner or parent. That stops a row pointing at another
--     family's file, which matters because service-role delete paths remove
--     whatever key a row names. If web recording ever lands with a different
--     container, widen the CHECK and the bucket MIME list together.
--
--   * Writes are owners and parents only, matching "Owners/parents can update
--     artworks": attaching a recording is an edit to the artwork. Any family
--     member, grandparents included, can listen.
--
-- Write order for clients: insert the artwork row, then upload the audio, then
-- set voice_note_path + voice_duration_seconds. The upload policy needs the
-- row to exist, and the save never waits on the audio.

-- ---------- columns ----------

ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS voice_note_path text,
  ADD COLUMN IF NOT EXISTS voice_duration_seconds integer;

ALTER TABLE artworks DROP CONSTRAINT IF EXISTS artworks_voice_note_path_check;
ALTER TABLE artworks ADD CONSTRAINT artworks_voice_note_path_check
  CHECK (voice_note_path IS NULL OR voice_note_path = family_id::text || '/' || id::text || '.m4a');

-- Clients cap recording at 60 seconds; the column agrees so a bad client
-- cannot claim otherwise. Path and duration are set and cleared together.
ALTER TABLE artworks DROP CONSTRAINT IF EXISTS artworks_voice_duration_check;
ALTER TABLE artworks ADD CONSTRAINT artworks_voice_duration_check
  CHECK (
    (voice_note_path IS NULL AND voice_duration_seconds IS NULL)
    OR (voice_note_path IS NOT NULL AND voice_duration_seconds BETWEEN 1 AND 60)
  );

COMMENT ON COLUMN artworks.voice_note_path IS
  'Object key in the private voice-notes bucket, always {family_id}/{artwork_id}.m4a. Play via a signed URL; never store a URL here.';
COMMENT ON COLUMN artworks.voice_duration_seconds IS
  'Length of the recording in whole seconds, 1 to 60.';

-- The baseline still defines this against the dropped voice_note_url column,
-- so calling it errors today. Point it at the new column.
CREATE OR REPLACE FUNCTION public.get_family_voice_stats(family_uuid uuid)
 RETURNS TABLE(total_notes bigint, total_seconds bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_family_member(family_uuid) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT COUNT(*)::BIGINT,
         COALESCE(SUM(voice_duration_seconds), 0)::BIGINT
  FROM artworks
  WHERE family_id = family_uuid AND voice_note_path IS NOT NULL;
END;
$function$;

-- ---------- bucket ----------

-- 60 seconds of mono AAC at 64 kbps is about 480 KB. 2 MB leaves headroom for
-- container overhead and a higher-bitrate encoder without inviting abuse.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('voice-notes', 'voice-notes', false, 2097152,
        ARRAY['audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------- storage policies ----------

-- Read: any member of the family whose folder it is. On a private bucket this
-- gates download, signed-URL creation and listing alike, and it is scoped TO
-- authenticated so the anon key sees nothing. Same shape as 008, recreated
-- here so this file stands on its own.
DROP POLICY IF EXISTS "Public can view voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Family members can view voice note files" ON storage.objects;
CREATE POLICY "Family members can view voice note files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] IN (
      SELECT family_id::text FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Write: owners and parents, and only at the one key an existing artwork in
-- their family is allowed to have. get_family_role is SECURITY DEFINER and
-- keyed on auth.uid(), as the artworks policies already use it.
DROP POLICY IF EXISTS "Owners and parents can upload voice notes" ON storage.objects;
CREATE POLICY "Owners and parents can upload voice notes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'voice-notes'
    AND EXISTS (
      SELECT 1 FROM artworks a
      WHERE objects.name = a.family_id::text || '/' || a.id::text || '.m4a'
        AND get_family_role(a.family_id) IN ('owner', 'parent')
    )
  );

-- Re-recording overwrites in place (upsert), which storage performs as an
-- UPDATE on the existing object.
DROP POLICY IF EXISTS "Owners and parents can replace voice notes" ON storage.objects;
CREATE POLICY "Owners and parents can replace voice notes"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'voice-notes'
    AND EXISTS (
      SELECT 1 FROM artworks a
      WHERE objects.name = a.family_id::text || '/' || a.id::text || '.m4a'
        AND get_family_role(a.family_id) IN ('owner', 'parent')
    )
  )
  WITH CHECK (
    bucket_id = 'voice-notes'
    AND EXISTS (
      SELECT 1 FROM artworks a
      WHERE objects.name = a.family_id::text || '/' || a.id::text || '.m4a'
        AND get_family_role(a.family_id) IN ('owner', 'parent')
    )
  );

-- Delete: owners and parents of the folder's family. Deliberately NOT tied to
-- the artwork row existing: an older client that deletes only the row (the
-- shipped 1.0.1 iOS build does) leaves the file behind, and it must still be
-- removable afterwards, by a sweep or by clearing the family folder.
DROP POLICY IF EXISTS "Owners and parents can delete voice notes" ON storage.objects;
CREATE POLICY "Owners and parents can delete voice notes"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] IN (
      SELECT family_id::text FROM family_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );
