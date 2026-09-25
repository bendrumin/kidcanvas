-- ============================================================
-- 014: App Store subscriptions, and one plan resolver for every client
-- ============================================================
-- A plan can now come from two sources:
--
--   'stripe'     the existing `subscriptions` table, one row per user, written
--                by app/api/stripe/webhook. Unchanged by this migration.
--   'app_store'  the new `app_store_subscriptions` table below, one row per
--                StoreKit subscription (original_transaction_id), written by
--                app/api/app-store/verify and app/api/app-store/notifications.
--
-- Why a second table instead of more columns on `subscriptions`: that table is
-- UNIQUE(user_id) and the Stripe webhook upserts on user_id, so a person who
-- subscribed on both platforms would have one source overwrite the other. A
-- separate table keeps each writer on its own rows, and the resolver picks the
-- best active entitlement across both.
--
-- get_user_plan() is the single answer to "what plan is this user on". The web
-- (lib/subscription.ts) and the iOS app both call it, so the two cannot disagree
-- about limits. It replaces the live get_user_subscription(), which returned
-- `tier` with no status filter and no limits; that function is left in place
-- for any older caller.
--
-- Written only. Not applied by the author; see ios/README.md.
-- ============================================================

CREATE TABLE IF NOT EXISTS app_store_subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Constant across renewals, upgrades and restores, so it is the identity of
  -- the subscription. UNIQUE is what makes every write idempotent.
  original_transaction_id text NOT NULL UNIQUE,
  latest_transaction_id text,
  product_id text NOT NULL,
  plan_id text NOT NULL CHECK (plan_id IN ('family', 'pro')),
  -- Mirrors App Store Server API subscription status, plus the two terminal
  -- reasons a transaction can be pulled back.
  status text NOT NULL CHECK (status IN (
    'active', 'grace_period', 'billing_retry', 'expired', 'revoked', 'refunded'
  )),
  expires_at timestamptz,
  -- Apple keeps access on during a billing grace period even though expires_at
  -- has passed; without this a failed card would drop someone to free early.
  grace_period_expires_at timestamptz,
  revoked_at timestamptz,
  auto_renew boolean,
  environment text NOT NULL CHECK (environment IN ('Production', 'Sandbox')),
  -- signedDate of the newest Apple-signed payload applied to this row.
  -- Notifications can arrive out of order and retried; anything older than
  -- this is ignored, which is what makes redelivery harmless.
  last_signed_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_store_subscriptions_user_id
  ON app_store_subscriptions(user_id);

ALTER TABLE app_store_subscriptions ENABLE ROW LEVEL SECURITY;

-- Read-only for the owner. There is deliberately no INSERT/UPDATE policy: the
-- only writer is the service role, after verifying Apple's signature, through
-- apply_app_store_transaction() below.
DROP POLICY IF EXISTS "Users can view their own app store subscriptions" ON app_store_subscriptions;
CREATE POLICY "Users can view their own app store subscriptions"
  ON app_store_subscriptions FOR SELECT
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS app_store_subscriptions_updated_at ON app_store_subscriptions;
CREATE TRIGGER app_store_subscriptions_updated_at
  BEFORE UPDATE ON app_store_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();


-- ---------- WRITE PATH ----------
-- One atomic, idempotent write for both routes. Returns what happened so the
-- caller can answer the client honestly:
--   'applied'   row inserted or moved forward
--   'stale'     an equal or newer payload was already applied (a retry)
--   'conflict'  this subscription already belongs to a different user
-- The ownership check matters: without it, one Apple ID's subscription could be
-- "restored" onto any number of KidCanvas accounts.
CREATE OR REPLACE FUNCTION public.apply_app_store_transaction(
  p_user_id uuid,
  p_original_transaction_id text,
  p_latest_transaction_id text,
  p_product_id text,
  p_plan_id text,
  p_status text,
  p_expires_at timestamptz,
  p_grace_period_expires_at timestamptz,
  p_revoked_at timestamptz,
  p_auto_renew boolean,
  p_environment text,
  p_signed_at timestamptz
)
RETURNS TABLE(outcome text, owner_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing app_store_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO existing
  FROM app_store_subscriptions
  WHERE original_transaction_id = p_original_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO app_store_subscriptions (
      user_id, original_transaction_id, latest_transaction_id, product_id,
      plan_id, status, expires_at, grace_period_expires_at, revoked_at,
      auto_renew, environment, last_signed_at
    ) VALUES (
      p_user_id, p_original_transaction_id, p_latest_transaction_id, p_product_id,
      p_plan_id, p_status, p_expires_at, p_grace_period_expires_at, p_revoked_at,
      p_auto_renew, p_environment, p_signed_at
    )
    -- Two deliveries racing on the first insert: the loser becomes a retry.
    ON CONFLICT (original_transaction_id) DO NOTHING;

    IF FOUND THEN
      RETURN QUERY SELECT 'applied'::text, p_user_id;
      RETURN;
    END IF;

    SELECT * INTO existing
    FROM app_store_subscriptions
    WHERE original_transaction_id = p_original_transaction_id;

    IF existing.user_id <> p_user_id THEN
      RETURN QUERY SELECT 'conflict'::text, existing.user_id;
    ELSE
      RETURN QUERY SELECT 'stale'::text, existing.user_id;
    END IF;
    RETURN;
  END IF;

  IF existing.user_id <> p_user_id THEN
    RETURN QUERY SELECT 'conflict'::text, existing.user_id;
    RETURN;
  END IF;

  IF existing.last_signed_at > p_signed_at THEN
    RETURN QUERY SELECT 'stale'::text, existing.user_id;
    RETURN;
  END IF;

  UPDATE app_store_subscriptions SET
    latest_transaction_id = p_latest_transaction_id,
    product_id = p_product_id,
    plan_id = p_plan_id,
    status = p_status,
    expires_at = p_expires_at,
    -- The app's verify call carries no renewal info, so it passes NULL here;
    -- keep what a notification last told us rather than erasing it.
    grace_period_expires_at = COALESCE(p_grace_period_expires_at, existing.grace_period_expires_at),
    revoked_at = p_revoked_at,
    auto_renew = COALESCE(p_auto_renew, existing.auto_renew),
    environment = p_environment,
    last_signed_at = p_signed_at
  WHERE id = existing.id;

  RETURN QUERY SELECT 'applied'::text, existing.user_id;
END;
$function$;

-- Service role only. The routes verify Apple's signature before calling this;
-- a signed-in user calling it directly would be granting themselves a plan.
REVOKE ALL ON FUNCTION public.apply_app_store_transaction(
  uuid, text, text, text, text, text, timestamptz, timestamptz, timestamptz, boolean, text, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_app_store_transaction(
  uuid, text, text, text, text, text, timestamptz, timestamptz, timestamptz, boolean, text, timestamptz
) TO service_role;


-- ---------- READ PATH ----------
-- Best active entitlement from any source. Limits live here as well as in
-- lib/stripe.ts PLANS because the iOS app reads them from this function; the
-- two must match (free: 50 artworks, 1 child, 1 family).
--
-- "Active" is judged by time, not only by status, for App Store rows: if an
-- EXPIRED notification is ever lost, access still ends at expires_at instead
-- of lasting forever. A renewal the server missed is repaired the next time
-- the app opens, because StoreKit delivers the renewed transaction to it.
CREATE OR REPLACE FUNCTION public.get_user_plan(target_user_id uuid)
RETURNS TABLE(
  plan_id text,
  source text,
  status text,
  expires_at timestamptz,
  artwork_limit integer,
  family_limit integer,
  children_limit integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- IS DISTINCT FROM, not <>: with no session auth.uid() is NULL, and
  -- `x <> NULL` is NULL, which IF treats as false and would let anyone read
  -- anyone's plan.
  IF target_user_id IS DISTINCT FROM auth.uid()
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT s.tier AS plan_id, 'stripe'::text AS source, s.status,
           s.current_period_end AS expires_at
    FROM subscriptions s
    WHERE s.user_id = target_user_id
      AND s.status IN ('active', 'trialing')
      AND s.tier IN ('family', 'pro')
    UNION ALL
    SELECT a.plan_id, 'app_store'::text, a.status,
           GREATEST(a.expires_at, a.grace_period_expires_at)
    FROM app_store_subscriptions a
    WHERE a.user_id = target_user_id
      AND a.revoked_at IS NULL
      -- Not a positive status list: the app's own verify call can only say
      -- 'expired' once expires_at passes, and must not cut short a grace
      -- period a notification already recorded.
      AND a.status NOT IN ('revoked', 'refunded')
      AND (
        a.expires_at > now()
        OR (a.grace_period_expires_at IS NOT NULL AND a.grace_period_expires_at > now())
      )
  ),
  best AS (
    SELECT c.*
    FROM candidates c
    ORDER BY CASE c.plan_id WHEN 'pro' THEN 2 WHEN 'family' THEN 1 ELSE 0 END DESC,
             c.expires_at DESC NULLS LAST
    LIMIT 1
  ),
  resolved AS (
    SELECT COALESCE(b.plan_id, 'free') AS plan_id,
           COALESCE(b.source, 'none') AS source,
           COALESCE(b.status, 'active') AS status,
           b.expires_at
    FROM (SELECT 1) one
    LEFT JOIN best b ON true
  )
  SELECT r.plan_id, r.source, r.status, r.expires_at,
         CASE WHEN r.plan_id = 'free' THEN 50 ELSE -1 END,
         CASE WHEN r.plan_id = 'pro' THEN -1 ELSE 1 END,
         CASE WHEN r.plan_id = 'free' THEN 1 ELSE -1 END
  FROM resolved r;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_user_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid) TO authenticated, service_role;
