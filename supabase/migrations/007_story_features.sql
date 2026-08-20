-- KidCanvas 007 — story features, reactions, comments, billing table.
--
-- Written against the LIVE state of the project on 2026-08-20, which already
-- had: families, family_members, family_invites, children, artworks,
-- collections, collection_artworks, share_links; the create_family_for_user,
-- accept_family_invite, is_family_member and delete_my_account functions; and
-- both storage buckets. This file adds only what was actually missing, and is
-- idempotent so it can be re-run safely.
--
-- Missing at the time of writing:
--   artworks columns: story, moment_photo_url, voice_note_url,
--                     voice_duration_seconds, voice_uploaded_at
--   tables:           artwork_reactions, artwork_comments, subscriptions
--   functions:        get_artwork_reaction_counts, user_has_reacted,
--                     get_user_subscription, get_family_voice_stats
--
-- No AI anywhere. Voice *transcription* is deliberately not included.

-- ============================================
-- 1. STORY + MOMENT PHOTO
-- ============================================

ALTER TABLE artworks ADD COLUMN IF NOT EXISTS story TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS moment_photo_url TEXT;

-- Voice note columns: playback already exists on the web app. Recording is a
-- later feature; the columns are nullable and cost nothing to have ready.
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS voice_note_url TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS voice_duration_seconds INTEGER;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS voice_uploaded_at TIMESTAMPTZ;

-- The feed reads newest-first within a family.
CREATE INDEX IF NOT EXISTS idx_artworks_family_uploaded
  ON artworks(family_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_artworks_has_voice_note
  ON artworks(family_id) WHERE voice_note_url IS NOT NULL;

-- ============================================
-- 2. REACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS artwork_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji_type TEXT NOT NULL CHECK (emoji_type IN ('❤️', '😍', '🎨', '👏', '🌟')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artwork_id, user_id, emoji_type)
);

CREATE INDEX IF NOT EXISTS idx_artwork_reactions_artwork_id ON artwork_reactions(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_reactions_user_id ON artwork_reactions(user_id);

ALTER TABLE artwork_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can view reactions" ON artwork_reactions;
CREATE POLICY "Family members can view reactions"
  ON artwork_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM artworks a
      WHERE a.id = artwork_id AND is_family_member(a.family_id)
    )
  );

DROP POLICY IF EXISTS "Family members can add reactions" ON artwork_reactions;
CREATE POLICY "Family members can add reactions"
  ON artwork_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM artworks a
      WHERE a.id = artwork_id AND is_family_member(a.family_id)
    )
  );

DROP POLICY IF EXISTS "Users can remove own reactions" ON artwork_reactions;
CREATE POLICY "Users can remove own reactions"
  ON artwork_reactions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 3. COMMENTS
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

ALTER TABLE artwork_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can view comments" ON artwork_comments;
CREATE POLICY "Family members can view comments"
  ON artwork_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM artworks a
      WHERE a.id = artwork_id AND is_family_member(a.family_id)
    )
  );

DROP POLICY IF EXISTS "Family members can add comments" ON artwork_comments;
CREATE POLICY "Family members can add comments"
  ON artwork_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM artworks a
      WHERE a.id = artwork_id AND is_family_member(a.family_id)
    )
  );

DROP POLICY IF EXISTS "Users can edit own comments" ON artwork_comments;
CREATE POLICY "Users can edit own comments"
  ON artwork_comments FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own comments" ON artwork_comments;
CREATE POLICY "Users can delete own comments"
  ON artwork_comments FOR DELETE
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS artwork_comments_updated_at ON artwork_comments;
CREATE TRIGGER artwork_comments_updated_at
  BEFORE UPDATE ON artwork_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();

-- ============================================
-- 4. REACTION HELPERS
-- ============================================

CREATE OR REPLACE FUNCTION get_artwork_reaction_counts(artwork_uuid UUID)
RETURNS TABLE (emoji_type TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER bypasses RLS, so gate on membership explicitly.
  IF NOT EXISTS (
    SELECT 1 FROM artworks a
    WHERE a.id = artwork_uuid AND is_family_member(a.family_id)
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT ar.emoji_type, COUNT(*)::BIGINT
  FROM artwork_reactions ar
  WHERE ar.artwork_id = artwork_uuid
  GROUP BY ar.emoji_type
  ORDER BY 2 DESC, ar.emoji_type;
END;
$$;

CREATE OR REPLACE FUNCTION user_has_reacted(artwork_uuid UUID, emoji TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM artwork_reactions
    WHERE artwork_id = artwork_uuid
      AND user_id = auth.uid()
      AND emoji_type = emoji
  );
END;
$$;

-- ============================================
-- 5. SUBSCRIPTIONS (table only — no billing is live yet)
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'family', 'pro')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Writes are intentionally service-role only (Stripe webhooks); no client policy.

CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

CREATE OR REPLACE FUNCTION get_user_subscription(target_user_id UUID)
RETURNS TABLE (tier TEXT, status TEXT, current_period_end TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF target_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT s.tier, s.status, s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = target_user_id;
END;
$$;

-- ============================================
-- 6. VOICE STATS (used by the web app's stats card)
-- ============================================

CREATE OR REPLACE FUNCTION get_family_voice_stats(family_uuid UUID)
RETURNS TABLE (total_notes BIGINT, total_seconds BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_family_member(family_uuid) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT COUNT(*)::BIGINT,
         COALESCE(SUM(voice_duration_seconds), 0)::BIGINT
  FROM artworks
  WHERE family_id = family_uuid AND voice_note_url IS NOT NULL;
END;
$$;
