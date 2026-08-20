-- KidCanvas iOS addendum — run AFTER the base schema.
-- Fully idempotent: safe to run any number of times.

-- Columns the iOS app expects
ALTER TABLE children ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE children ADD COLUMN IF NOT EXISTS avatar_color TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS description TEXT;

-- Public storage bucket for artwork images
INSERT INTO storage.buckets (id, name, public)
VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated can upload artworks" ON storage.objects;
CREATE POLICY "Authenticated can upload artworks"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'artworks');

DROP POLICY IF EXISTS "Public can view artworks" ON storage.objects;
CREATE POLICY "Public can view artworks"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artworks');

DROP POLICY IF EXISTS "Owners can delete their artwork files" ON storage.objects;
CREATE POLICY "Owners can delete their artwork files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'artworks' AND owner = auth.uid());
