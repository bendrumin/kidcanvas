-- Stop anonymous enumeration of the storage buckets.
--
-- The previous policies were `FOR SELECT USING (bucket_id = '...')` with no
-- role restriction, so they granted row visibility on storage.objects to the
-- anon role. That is exactly what POST /storage/v1/object/list reads, so any
-- caller holding the (publicly shipped) anon key could list every family
-- folder, then every artwork filename inside it, and then fetch the images.
-- The "URLs contain two random UUIDs so they are unguessable" assumption in
-- security_addendum.sql does not hold when the names can be listed.
--
-- Both buckets stay public-read, so /object/public/... keeps serving images to
-- the shipped iOS build and to unauthenticated visitors on /share/[code] --
-- that path bypasses RLS. This change removes discovery, not direct fetch.
-- Private buckets plus signed URLs remain the real fix and need client work.

DROP POLICY IF EXISTS "Public can view artworks" ON storage.objects;
DROP POLICY IF EXISTS "Family members can view artwork files" ON storage.objects;
CREATE POLICY "Family members can view artwork files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'artworks'
    AND (storage.foldername(name))[1] IN (
      SELECT family_id::text FROM family_members WHERE user_id = auth.uid()
    )
  );

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
