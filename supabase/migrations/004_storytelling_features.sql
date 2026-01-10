-- Storytelling Features Migration
-- Adds: story field, moment photos, reactions, and comments

-- ============================================
-- 1. UPDATE ARTWORKS TABLE
-- ============================================

-- Add story field (required, but we'll make it nullable first for migration, then update existing rows)
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS story TEXT;

-- Add moment_photo_url for the "moment" photo (child holding/creating artwork)
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS moment_photo_url TEXT;

-- For now, keep title but it will become optional (stories are primary)
-- We'll update existing artworks to have a basic story from title
UPDATE artworks 
SET story = CASE 
  WHEN story IS NULL AND title IS NOT NULL THEN 'Created: ' || title
  ELSE story
END;

-- Add constraint: story is required for new artworks (but allow NULL for now during migration)
-- We'll enforce this in application code initially, then add DB constraint later

-- ============================================
-- 2. CREATE REACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS artwork_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji_type TEXT NOT NULL CHECK (emoji_type IN ('❤️', '😍', '🎨', '👏', '🌟')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artwork_id, user_id, emoji_type) -- One reaction per user per artwork per emoji
);

CREATE INDEX IF NOT EXISTS idx_artwork_reactions_artwork_id ON artwork_reactions(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_reactions_user_id ON artwork_reactions(user_id);

-- ============================================
-- 3. CREATE COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS artwork_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL CHECK (char_length(text) > 0 AND char_length(text) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artwork_comments_artwork_id ON artwork_comments(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_comments_created_at ON artwork_comments(created_at DESC);

-- ============================================
-- 4. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE artwork_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES FOR REACTIONS
-- ============================================

-- Family members can view reactions
CREATE POLICY "Family members can view reactions"
  ON artwork_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM artworks a
      JOIN family_members fm ON fm.family_id = a.family_id
      WHERE a.id = artwork_reactions.artwork_id
      AND fm.user_id = auth.uid()
    )
  );

-- Family members can add reactions
CREATE POLICY "Family members can add reactions"
  ON artwork_reactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM artworks a
      JOIN family_members fm ON fm.family_id = a.family_id
      WHERE a.id = artwork_reactions.artwork_id
      AND fm.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
  ON artwork_reactions FOR DELETE
  USING (user_id = auth.uid());

-- Owners/parents can delete any reaction
CREATE POLICY "Owners/parents can delete reactions"
  ON artwork_reactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM artworks a
      JOIN family_members fm ON fm.family_id = a.family_id
      WHERE a.id = artwork_reactions.artwork_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('owner', 'parent')
    )
  );

-- ============================================
-- 6. RLS POLICIES FOR COMMENTS
-- ============================================

-- Family members can view comments
CREATE POLICY "Family members can view comments"
  ON artwork_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM artworks a
      JOIN family_members fm ON fm.family_id = a.family_id
      WHERE a.id = artwork_comments.artwork_id
      AND fm.user_id = auth.uid()
    )
  );

-- Family members can add comments
CREATE POLICY "Family members can add comments"
  ON artwork_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM artworks a
      JOIN family_members fm ON fm.family_id = a.family_id
      WHERE a.id = artwork_comments.artwork_id
      AND fm.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON artwork_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON artwork_comments FOR DELETE
  USING (user_id = auth.uid());

-- Owners/parents can delete any comment
CREATE POLICY "Owners/parents can delete comments"
  ON artwork_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM artworks a
      JOIN family_members fm ON fm.family_id = a.family_id
      WHERE a.id = artwork_comments.artwork_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('owner', 'parent')
    )
  );

-- ============================================
-- 7. TRIGGER FOR COMMENT UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artwork_comments_updated_at
  BEFORE UPDATE ON artwork_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();

-- ============================================
-- 8. HELPER FUNCTIONS FOR REACTIONS/COMMENTS
-- ============================================

-- Function to get reaction counts for an artwork
CREATE OR REPLACE FUNCTION get_artwork_reaction_counts(artwork_uuid UUID)
RETURNS TABLE (
  emoji_type TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.emoji_type,
    COUNT(*)::BIGINT
  FROM artwork_reactions ar
  WHERE ar.artwork_id = artwork_uuid
  GROUP BY ar.emoji_type
  ORDER BY count DESC, ar.emoji_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has reacted with specific emoji
CREATE OR REPLACE FUNCTION user_has_reacted(artwork_uuid UUID, emoji TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM artwork_reactions
    WHERE artwork_id = artwork_uuid
    AND user_id = auth.uid()
    AND emoji_type = emoji
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

