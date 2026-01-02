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

