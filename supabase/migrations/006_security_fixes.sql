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
