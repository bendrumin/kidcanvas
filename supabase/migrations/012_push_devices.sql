-- Remote push notifications to family members.
--
-- The feed only works as a retention loop if grandparents hear about a new
-- drawing without having to remember to open the app, and if the parent who
-- shared it hears back when someone reacts. This migration adds:
--
--   1. push_devices: one row per APNs token, owned by the signed-in user.
--   2. notification_preferences: per-user switches for the two kinds of push.
--   3. A trigger on artworks, artwork_comments, and artwork_reactions that asks
--      the web app's /api/notify route to fan the event out.
--
-- Why a database trigger rather than having each client call the API: iOS
-- writes artworks, comments, and reactions straight to Postgres through
-- PostgREST, and the web app writes comments and reactions from the browser
-- too. That is five write sites across two clients. A trigger fires for every
-- one of them, including clients that do not exist yet, and a client that is
-- backgrounded the moment it saves cannot drop the notification on the floor.
--
-- Why not a dashboard "Database Webhook": those live only in the dashboard, so
-- this repo could not tell you whether one exists. See supabase/README.md.
--
-- The trigger sends only {table, id}. /api/notify re-reads the row with the
-- service role and derives the family and recipients itself, so a leaked
-- webhook secret can at worst re-announce something that really happened, to
-- people who can already see it.

-- ---------- TABLES ----------

CREATE TABLE IF NOT EXISTS push_devices (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Hex-encoded APNs device token. Unique because a physical device has one
  -- token per app install, whoever happens to be signed in on it.
  token text NOT NULL UNIQUE,
  -- Debug builds get sandbox tokens and must be sent to the sandbox host;
  -- TestFlight and App Store builds get production tokens.
  environment text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_devices_user_id ON push_devices (user_id);

-- A missing row means "everything on", so nobody has to write a row before
-- they start receiving pushes they already granted permission for.
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  new_artwork boolean DEFAULT true NOT NULL,
  comments_reactions boolean DEFAULT true NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ---------- RLS ----------
-- rls_auto_enable() turns RLS on for new tables already; stating it here keeps
-- the migration correct on a database where that event trigger is missing.

ALTER TABLE push_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push devices" ON push_devices;
CREATE POLICY "Users can view own push devices"
  ON push_devices FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can add own push devices" ON push_devices;
CREATE POLICY "Users can add own push devices"
  ON push_devices FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own push devices" ON push_devices;
CREATE POLICY "Users can update own push devices"
  ON push_devices FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove own push devices" ON push_devices;
CREATE POLICY "Users can remove own push devices"
  ON push_devices FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can add own notification preferences" ON notification_preferences;
CREATE POLICY "Users can add own notification preferences"
  ON notification_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------- DEVICE REGISTRATION ----------

-- Registering goes through a function rather than a plain upsert because the
-- token is unique per device, not per user. When a second person signs in on
-- a phone, the row still belongs to the first, and RLS rightly refuses to let
-- the second update it, so an upsert would fail and the new user would never
-- get pushes. This moves the token to whoever is signed in now, which is also
-- what stops the previous user's family news from landing on that phone.
--
-- Claiming a token requires knowing it; tokens are never readable by anyone
-- but their owner, so this cannot be used to hijack someone else's device.
CREATE OR REPLACE FUNCTION public.register_push_device(device_token text, device_environment text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF device_environment NOT IN ('sandbox', 'production') THEN
    RAISE EXCEPTION 'Invalid environment';
  END IF;
  IF device_token !~ '^[0-9a-f]{64,200}$' THEN
    RAISE EXCEPTION 'Invalid device token';
  END IF;

  INSERT INTO push_devices (user_id, token, environment)
  VALUES (auth.uid(), device_token, device_environment)
  ON CONFLICT (token) DO UPDATE
    SET user_id = auth.uid(),
        environment = EXCLUDED.environment,
        updated_at = now();
END;
$function$;

REVOKE ALL ON FUNCTION public.register_push_device(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_push_device(text, text) TO authenticated;

-- ---------- FAN-OUT TRIGGER ----------

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- The endpoint and its shared secret live in Supabase Vault, not in this file,
-- so the secret never lands in git and a staging database can point somewhere
-- else. Until both secrets exist the trigger does nothing, which makes this
-- migration safe to apply before the web side is deployed.
CREATE OR REPLACE FUNCTION public.notify_family_push()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  endpoint text;
  secret text;
BEGIN
  SELECT decrypted_secret INTO endpoint
    FROM vault.decrypted_secrets WHERE name = 'push_notify_url';
  SELECT decrypted_secret INTO secret
    FROM vault.decrypted_secrets WHERE name = 'push_notify_secret';

  IF endpoint IS NULL OR secret IS NULL THEN
    RETURN NEW;
  END IF;

  -- pg_net queues the request and sends it after this transaction commits, so
  -- the insert never waits on the network, and a rolled-back insert never
  -- announces anything.
  PERFORM net.http_post(
    url := endpoint,
    body := jsonb_build_object('table', TG_TABLE_NAME, 'id', NEW.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret
    ),
    timeout_milliseconds := 10000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A notification is never worth losing the drawing, comment, or reaction.
  RAISE WARNING 'notify_family_push failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_family_push() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS artworks_notify_family_push ON public.artworks;
CREATE TRIGGER artworks_notify_family_push
  AFTER INSERT ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.notify_family_push();

DROP TRIGGER IF EXISTS artwork_comments_notify_family_push ON public.artwork_comments;
CREATE TRIGGER artwork_comments_notify_family_push
  AFTER INSERT ON public.artwork_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_family_push();

DROP TRIGGER IF EXISTS artwork_reactions_notify_family_push ON public.artwork_reactions;
CREATE TRIGGER artwork_reactions_notify_family_push
  AFTER INSERT ON public.artwork_reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_family_push();
