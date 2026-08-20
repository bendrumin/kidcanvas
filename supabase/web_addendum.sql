-- KidCanvas web addendum — run AFTER schema.sql and ios_addendum.sql.
-- Adds the tables and columns the Next.js web app needs (subscriptions,
-- reactions, comments, voice notes) plus the voice-notes storage bucket.
-- Contains no AI processing.

-- ============================================
-- 002_subscriptions.sql
-- ============================================
-- Subscriptions table (synced from Stripe)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'family', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  billing_interval TEXT CHECK (billing_interval IN ('month', 'year')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Only service role can modify subscriptions (via webhook)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Function to get user's plan with limits
CREATE OR REPLACE FUNCTION get_user_subscription(target_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  status TEXT,
  artwork_limit INTEGER,
  family_limit INTEGER,
  children_limit INTEGER,
  current_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.plan_id, 'free') as plan_id,
    COALESCE(s.status, 'active') as status,
    CASE 
      WHEN COALESCE(s.plan_id, 'free') = 'free' THEN 100
      ELSE -1 -- unlimited
    END as artwork_limit,
    CASE 
      WHEN COALESCE(s.plan_id, 'free') = 'pro' THEN -1
      ELSE 1
    END as family_limit,
    CASE 
      WHEN COALESCE(s.plan_id, 'free') = 'free' THEN 3
      ELSE -1
    END as children_limit,
    s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = target_user_id
  AND s.status IN ('active', 'trialing')
  LIMIT 1;
  
  -- If no subscription found, return free plan defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'free'::TEXT,
      'active'::TEXT,
      100,
      1,
      3,
      NULL::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();


-- ============================================
-- 004_storytelling_features.sql
-- ============================================
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


-- ============================================
-- 005_voice_notes.sql
-- ============================================
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

-- ============================================
-- 006_security_fixes.sql
-- ============================================
-- Security Fixes Migration
-- Adds null checks to SECURITY DEFINER functions

-- ============================================
-- 1. FIX get_user_subscription FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_user_subscription(target_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  status TEXT,
  artwork_limit INTEGER,
  family_limit INTEGER,
  children_limit INTEGER,
  current_period_end TIMESTAMPTZ
) AS $$
BEGIN
  -- SECURITY: Validate input parameter
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'target_user_id cannot be null';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(s.plan_id, 'free') as plan_id,
    COALESCE(s.status, 'active') as status,
    CASE
      WHEN COALESCE(s.plan_id, 'free') = 'free' THEN 100
      ELSE -1 -- unlimited
    END as artwork_limit,
    CASE
      WHEN COALESCE(s.plan_id, 'free') = 'pro' THEN -1
      ELSE 1
    END as family_limit,
    CASE
      WHEN COALESCE(s.plan_id, 'free') = 'free' THEN 3
      ELSE -1
    END as children_limit,
    s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = target_user_id
  AND s.status IN ('active', 'trialing')
  LIMIT 1;

  -- If no subscription found, return free plan defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      'free'::TEXT,
      'active'::TEXT,
      100,
      1,
      3,
      NULL::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_subscription(UUID) IS 'Gets user subscription with null check validation';

-- ============================================
-- 2. FIX get_family_voice_stats FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_family_voice_stats(family_uuid UUID)
RETURNS TABLE (
  total_artworks BIGINT,
  artworks_with_voice BIGINT,
  total_voice_duration_seconds BIGINT,
  avg_voice_duration_seconds NUMERIC
) AS $$
BEGIN
  -- SECURITY: Validate input parameter
  IF family_uuid IS NULL THEN
    RAISE EXCEPTION 'family_uuid cannot be null';
  END IF;

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

COMMENT ON FUNCTION get_family_voice_stats(UUID) IS 'Gets family voice note statistics with null check validation';

-- ============================================
-- 3. FIX get_reaction_summary FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_reaction_summary(artwork_uuid UUID)
RETURNS TABLE (
  emoji_type TEXT,
  count BIGINT,
  user_ids UUID[]
) AS $$
BEGIN
  -- SECURITY: Validate input parameter
  IF artwork_uuid IS NULL THEN
    RAISE EXCEPTION 'artwork_uuid cannot be null';
  END IF;

  RETURN QUERY
  SELECT
    ar.emoji_type,
    COUNT(*)::BIGINT as count,
    ARRAY_AGG(ar.user_id) as user_ids
  FROM artwork_reactions ar
  WHERE ar.artwork_id = artwork_uuid
  GROUP BY ar.emoji_type
  ORDER BY count DESC, ar.emoji_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_reaction_summary(UUID) IS 'Gets reaction summary for artwork with null check validation';

-- ============================================
-- 4. FIX user_has_reacted FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION user_has_reacted(artwork_uuid UUID, emoji TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY: Validate input parameters
  IF artwork_uuid IS NULL THEN
    RAISE EXCEPTION 'artwork_uuid cannot be null';
  END IF;

  IF emoji IS NULL OR emoji = '' THEN
    RAISE EXCEPTION 'emoji cannot be null or empty';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM artwork_reactions
    WHERE artwork_id = artwork_uuid
    AND user_id = auth.uid()
    AND emoji_type = emoji
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_reacted(UUID, TEXT) IS 'Checks if user reacted with emoji with null check validation';

-- ============================================
-- 5. ADD COMMENTS FOR SECURITY
-- ============================================

COMMENT ON TABLE subscriptions IS 'User subscription data synced from Stripe - protected by RLS';
COMMENT ON TABLE artworks IS 'Artwork uploads with voice notes - protected by RLS';

-- ============================================
-- STORAGE: voice notes bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated can upload voice notes" ON storage.objects;
CREATE POLICY "Authenticated can upload voice notes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'voice-notes');

DROP POLICY IF EXISTS "Public can view voice notes" ON storage.objects;
CREATE POLICY "Public can view voice notes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-notes');

DROP POLICY IF EXISTS "Owners can delete their voice notes" ON storage.objects;
CREATE POLICY "Owners can delete their voice notes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'voice-notes' AND owner = auth.uid());
