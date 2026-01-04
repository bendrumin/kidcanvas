-- Grant pro/family plan access to test account
-- Run this in Supabase SQL Editor

-- First, find the user ID for bsiegel13@gmail.com
-- SELECT id, email FROM auth.users WHERE email = 'bsiegel13@gmail.com';

-- Then insert or update subscription (replace USER_ID_HERE with actual UUID)
INSERT INTO subscriptions (
  user_id,
  plan_id,
  status,
  billing_interval,
  current_period_start,
  current_period_end,
  cancel_at_period_end
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'bsiegel13@gmail.com' LIMIT 1),
  'family', -- or 'pro' for unlimited families too
  'active',
  'year',
  NOW(),
  NOW() + INTERVAL '100 years', -- Basically permanent
  FALSE
)
ON CONFLICT (user_id) DO UPDATE SET
  plan_id = 'family',
  status = 'active',
  billing_interval = 'year',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '100 years',
  cancel_at_period_end = FALSE,
  updated_at = NOW();

-- Verify it worked
SELECT
  u.email,
  s.plan_id,
  s.status,
  s.current_period_end
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'bsiegel13@gmail.com';
