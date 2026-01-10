-- Update free tier limits: 50 artworks, 1 child (down from 100 artworks, 3 children)

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
      WHEN COALESCE(s.plan_id, 'free') = 'free' THEN 50
      ELSE -1 -- unlimited
    END as artwork_limit,
    CASE 
      WHEN COALESCE(s.plan_id, 'free') = 'pro' THEN -1
      ELSE 1
    END as family_limit,
    CASE 
      WHEN COALESCE(s.plan_id, 'free') = 'free' THEN 1
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
      50,
      1,
      1,
      NULL::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

