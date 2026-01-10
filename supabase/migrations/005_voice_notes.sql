-- Voice Notes Migration
-- Adds voice note support to artworks

-- ============================================
-- 1. ADD VOICE NOTE FIELDS TO ARTWORKS
-- ============================================

-- Add voice note URL (stored in R2)
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS voice_note_url TEXT;

-- Add voice duration in seconds
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS voice_duration_seconds INTEGER;

-- Add voice note uploaded timestamp
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS voice_uploaded_at TIMESTAMPTZ;

-- ============================================
-- 2. CREATE INDEX FOR VOICE NOTES
-- ============================================

-- Index for filtering artworks with voice notes
CREATE INDEX IF NOT EXISTS idx_artworks_has_voice_note
ON artworks(voice_note_url)
WHERE voice_note_url IS NOT NULL;

-- ============================================
-- 3. HELPER FUNCTION FOR VOICE NOTE STATS
-- ============================================

-- Function to get voice note statistics for a family
CREATE OR REPLACE FUNCTION get_family_voice_stats(family_uuid UUID)
RETURNS TABLE (
  total_artworks BIGINT,
  artworks_with_voice BIGINT,
  total_voice_duration_seconds BIGINT,
  avg_voice_duration_seconds NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_artworks,
    COUNT(voice_note_url)::BIGINT as artworks_with_voice,
    COALESCE(SUM(voice_duration_seconds), 0)::BIGINT as total_voice_duration_seconds,
    COALESCE(AVG(voice_duration_seconds), 0)::NUMERIC as avg_voice_duration_seconds
  FROM artworks
  WHERE family_id = family_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 4. COMMENTS
-- ============================================

COMMENT ON COLUMN artworks.voice_note_url IS 'URL to voice note audio file in R2 storage';
COMMENT ON COLUMN artworks.voice_duration_seconds IS 'Duration of voice note in seconds';
COMMENT ON COLUMN artworks.voice_uploaded_at IS 'Timestamp when voice note was uploaded';
