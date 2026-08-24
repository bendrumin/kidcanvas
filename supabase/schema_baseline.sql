-- ============================================================
-- KidCanvas database baseline
-- ============================================================
-- Generated from the LIVE project by querying pg_catalog, not by
-- concatenating the older SQL files. Those files disagreed with each other and
-- with reality: policies were defined in three places under the same names,
-- two migrations both claimed number 003, and security_addendum.sql turned out
-- never to have been run at all (see migration 009).
--
-- Treat this file as the authoritative starting point. Anything that changes
-- the schema from here on should be a NEW numbered migration in
-- supabase/migrations/, never an edit to this file and never a loose
-- "addendum" script. To confirm this still matches production, re-run the
-- catalog queries rather than trusting this header.
--
-- Contents: 11 tables, 43 constraints, 33 indexes, 13 functions, 3 triggers,
-- RLS enabled on every table, 41 policies.
-- ============================================================


-- ---------- EXTENSIONS ----------
-- uuid-ossp backs the uuid_generate_v4() column defaults below; pgcrypto is
-- installed and available. Supabase places both in the `extensions` schema.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ---------- TABLES ----------

CREATE TABLE IF NOT EXISTS artwork_comments (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  artwork_id uuid NOT NULL,
  user_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artwork_reactions (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  artwork_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artworks (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  family_id uuid NOT NULL,
  child_id uuid NOT NULL,
  image_url text NOT NULL,
  thumbnail_url text NOT NULL,
  title text NOT NULL,
  created_date date NOT NULL,
  child_age_months integer,
  tags text[] DEFAULT '{}'::text[],
  ai_tags text[] DEFAULT '{}'::text[],
  ai_description text,
  is_favorite boolean DEFAULT false,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT now(),
  description text,
  story text,
  moment_photo_url text,
  voice_note_url text,
  voice_duration_seconds integer,
  voice_uploaded_at timestamptz
);

CREATE TABLE IF NOT EXISTS children (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  family_id uuid NOT NULL,
  name text NOT NULL,
  birth_date date,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  avatar_color text
);

CREATE TABLE IF NOT EXISTS collection_artworks (
  collection_id uuid NOT NULL,
  artwork_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS collections (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  family_id uuid NOT NULL,
  name text NOT NULL,
  cover_artwork_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS families (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS family_invites (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  family_id uuid NOT NULL,
  code text NOT NULL,
  role text NOT NULL,
  nickname text,
  invited_email text,
  expires_at timestamptz DEFAULT (now() + '7 days'::interval),
  used_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS family_members (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  family_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  nickname text,
  joined_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS share_links (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  family_id uuid NOT NULL,
  code text NOT NULL,
  type text NOT NULL,
  resource_id uuid NOT NULL,
  password_hash text,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL,
  tier text DEFAULT 'free'::text NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- ---------- PRIMARY KEYS & UNIQUE ----------

ALTER TABLE artwork_comments ADD CONSTRAINT artwork_comments_pkey PRIMARY KEY (id);
ALTER TABLE artwork_reactions ADD CONSTRAINT artwork_reactions_pkey PRIMARY KEY (id);
ALTER TABLE artwork_reactions ADD CONSTRAINT artwork_reactions_artwork_id_user_id_emoji_type_key UNIQUE (artwork_id, user_id, emoji_type);
ALTER TABLE artworks ADD CONSTRAINT artworks_pkey PRIMARY KEY (id);
ALTER TABLE children ADD CONSTRAINT children_pkey PRIMARY KEY (id);
ALTER TABLE collection_artworks ADD CONSTRAINT collection_artworks_pkey PRIMARY KEY (collection_id, artwork_id);
ALTER TABLE collections ADD CONSTRAINT collections_pkey PRIMARY KEY (id);
ALTER TABLE families ADD CONSTRAINT families_pkey PRIMARY KEY (id);
ALTER TABLE family_invites ADD CONSTRAINT family_invites_pkey PRIMARY KEY (id);
ALTER TABLE family_invites ADD CONSTRAINT family_invites_code_key UNIQUE (code);
ALTER TABLE family_members ADD CONSTRAINT family_members_pkey PRIMARY KEY (id);
ALTER TABLE family_members ADD CONSTRAINT family_members_family_id_user_id_key UNIQUE (family_id, user_id);
ALTER TABLE share_links ADD CONSTRAINT share_links_pkey PRIMARY KEY (id);
ALTER TABLE share_links ADD CONSTRAINT share_links_code_key UNIQUE (code);
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

-- ---------- FOREIGN KEYS & CHECKS ----------

ALTER TABLE artwork_comments ADD CONSTRAINT artwork_comments_text_check CHECK (((char_length(text) > 0) AND (char_length(text) <= 500)));
ALTER TABLE artwork_comments ADD CONSTRAINT artwork_comments_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;
ALTER TABLE artwork_comments ADD CONSTRAINT artwork_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE artwork_reactions ADD CONSTRAINT artwork_reactions_emoji_type_check CHECK ((emoji_type = ANY (ARRAY['❤️'::text, '😍'::text, '🎨'::text, '👏'::text, '🌟'::text])));
ALTER TABLE artwork_reactions ADD CONSTRAINT artwork_reactions_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;
ALTER TABLE artwork_reactions ADD CONSTRAINT artwork_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE artworks ADD CONSTRAINT artworks_child_id_fkey FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;
ALTER TABLE artworks ADD CONSTRAINT artworks_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
ALTER TABLE artworks ADD CONSTRAINT artworks_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE children ADD CONSTRAINT children_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
ALTER TABLE collection_artworks ADD CONSTRAINT collection_artworks_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;
ALTER TABLE collection_artworks ADD CONSTRAINT collection_artworks_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;
ALTER TABLE collections ADD CONSTRAINT collections_cover_artwork_id_fkey FOREIGN KEY (cover_artwork_id) REFERENCES artworks(id) ON DELETE SET NULL;
ALTER TABLE collections ADD CONSTRAINT collections_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
ALTER TABLE families ADD CONSTRAINT families_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE family_invites ADD CONSTRAINT family_invites_role_check CHECK ((role = ANY (ARRAY['parent'::text, 'member'::text, 'viewer'::text])));
ALTER TABLE family_invites ADD CONSTRAINT family_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE family_invites ADD CONSTRAINT family_invites_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
ALTER TABLE family_members ADD CONSTRAINT family_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'parent'::text, 'member'::text, 'viewer'::text])));
ALTER TABLE family_members ADD CONSTRAINT family_members_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
ALTER TABLE family_members ADD CONSTRAINT family_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE share_links ADD CONSTRAINT share_links_type_check CHECK ((type = ANY (ARRAY['artwork'::text, 'collection'::text])));
ALTER TABLE share_links ADD CONSTRAINT share_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE share_links ADD CONSTRAINT share_links_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'canceled'::text, 'past_due'::text, 'trialing'::text, 'incomplete'::text])));
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_tier_check CHECK ((tier = ANY (ARRAY['free'::text, 'family'::text, 'pro'::text])));
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ---------- INDEXES ----------

CREATE INDEX IF NOT EXISTS idx_artwork_comments_artwork_id ON public.artwork_comments USING btree (artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_comments_created_at ON public.artwork_comments USING btree (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS artwork_reactions_artwork_id_user_id_emoji_type_key ON public.artwork_reactions USING btree (artwork_id, user_id, emoji_type);
CREATE INDEX IF NOT EXISTS idx_artwork_reactions_artwork_id ON public.artwork_reactions USING btree (artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_reactions_user_id ON public.artwork_reactions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_artworks_child_id ON public.artworks USING btree (child_id);
CREATE INDEX IF NOT EXISTS idx_artworks_created_date ON public.artworks USING btree (created_date DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_family_id ON public.artworks USING btree (family_id);
CREATE INDEX IF NOT EXISTS idx_artworks_family_uploaded ON public.artworks USING btree (family_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_has_voice_note ON public.artworks USING btree (family_id) WHERE (voice_note_url IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_artworks_is_favorite ON public.artworks USING btree (is_favorite) WHERE (is_favorite = true);
CREATE INDEX IF NOT EXISTS idx_children_family_id ON public.children USING btree (family_id);
CREATE UNIQUE INDEX IF NOT EXISTS family_invites_code_key ON public.family_invites USING btree (code);
CREATE INDEX IF NOT EXISTS idx_family_invites_code ON public.family_invites USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS family_members_family_id_user_id_key ON public.family_members USING btree (family_id, user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON public.family_members USING btree (family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_code ON public.share_links USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS share_links_code_key ON public.share_links USING btree (code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions USING btree (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_key ON public.subscriptions USING btree (user_id);

-- ---------- FUNCTIONS ----------

CREATE OR REPLACE FUNCTION public.accept_family_invite(invite_code text, member_nickname text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  invite_record family_invites%ROWTYPE;
BEGIN
  -- Get the invite
  SELECT * INTO invite_record
  FROM family_invites
  WHERE code = invite_code
  AND used_at IS NULL
  AND expires_at > NOW();
  
  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = invite_record.family_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already a member of this family';
  END IF;
  
  -- Add user as member
  INSERT INTO family_members (family_id, user_id, role, nickname)
  VALUES (
    invite_record.family_id,
    auth.uid(),
    invite_record.role,
    COALESCE(member_nickname, invite_record.nickname)
  );
  
  -- Mark invite as used
  UPDATE family_invites
  SET used_at = NOW()
  WHERE id = invite_record.id;
  
  RETURN invite_record.family_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_child_age_months()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.child_id IS NOT NULL AND NEW.created_date IS NOT NULL THEN
    SELECT 
      EXTRACT(YEAR FROM age(NEW.created_date, c.birth_date)) * 12 +
      EXTRACT(MONTH FROM age(NEW.created_date, c.birth_date))
    INTO NEW.child_age_months
    FROM children c
    WHERE c.id = NEW.child_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_family_for_user(family_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_family_id UUID;
BEGIN
  -- Create the family
  INSERT INTO families (name, created_by)
  VALUES (family_name, auth.uid())
  RETURNING id INTO new_family_id;
  
  -- Add user as owner
  INSERT INTO family_members (family_id, user_id, role, nickname)
  VALUES (new_family_id, auth.uid(), 'owner', NULL);
  
  RETURN new_family_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_my_account()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  uid UUID := auth.uid();
  owned RECORD;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Families this user owns go away entirely; ON DELETE CASCADE takes the
  -- children, artworks, collections, invites, and share links with them.
  FOR owned IN
    SELECT family_id FROM family_members WHERE user_id = uid AND role = 'owner'
  LOOP
    DELETE FROM families WHERE id = owned.family_id;
  END LOOP;

  -- Memberships in families owned by someone else.
  DELETE FROM family_members WHERE user_id = uid;

  -- Finally the auth record itself, so the account is gone rather than
  -- deactivated (Apple requires full deletion).
  DELETE FROM auth.users WHERE id = uid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_artwork_reaction_counts(artwork_uuid uuid)
 RETURNS TABLE(emoji_type text, count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_family_role(family_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM family_members
  WHERE family_id = family_uuid
  AND user_id = auth.uid();
  
  RETURN user_role;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_family_voice_stats(family_uuid uuid)
 RETURNS TABLE(total_notes bigint, total_seconds bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_user_subscription(target_user_id uuid)
 RETURNS TABLE(tier text, status text, current_period_end timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF target_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT s.tier, s.status, s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = target_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_family_member(family_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = family_uuid
    AND user_id = auth.uid()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_comment_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_reacted(artwork_uuid uuid, emoji text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM artwork_reactions
    WHERE artwork_id = artwork_uuid
      AND user_id = auth.uid()
      AND emoji_type = emoji
  );
END;
$function$;


-- ---------- TRIGGERS ----------

DROP TRIGGER IF EXISTS artwork_comments_updated_at ON public.artwork_comments;
CREATE TRIGGER artwork_comments_updated_at BEFORE UPDATE ON public.artwork_comments FOR EACH ROW EXECUTE FUNCTION update_comment_updated_at();
DROP TRIGGER IF EXISTS set_child_age_months ON public.artworks;
CREATE TRIGGER set_child_age_months BEFORE INSERT OR UPDATE ON public.artworks FOR EACH ROW EXECUTE FUNCTION calculate_child_age_months();
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

-- ---------- EVENT TRIGGER ----------
-- Project-specific safety net: rls_auto_enable() runs after any DDL and turns
-- RLS on for newly created tables, so a table added in a hurry cannot sit
-- world-readable. This is why every table reports RLS enabled. The other event
-- triggers on this database (pgrst_*, issue_pg_*, issue_graphql_*) are managed
-- by Supabase and deliberately not recreated here.
DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
  EXECUTE FUNCTION rls_auto_enable();

-- ---------- ROW LEVEL SECURITY ----------

ALTER TABLE artwork_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ---------- POLICIES (public) ----------

DROP POLICY IF EXISTS "Users can delete own comments" ON artwork_comments;
CREATE POLICY "Users can delete own comments"
  ON artwork_comments FOR DELETE
  USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "Family members can add comments" ON artwork_comments;
CREATE POLICY "Family members can add comments"
  ON artwork_comments FOR INSERT
  WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM artworks a
  WHERE ((a.id = artwork_comments.artwork_id) AND is_family_member(a.family_id))))));

DROP POLICY IF EXISTS "Family members can view comments" ON artwork_comments;
CREATE POLICY "Family members can view comments"
  ON artwork_comments FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM artworks a
  WHERE ((a.id = artwork_comments.artwork_id) AND is_family_member(a.family_id)))));

DROP POLICY IF EXISTS "Users can edit own comments" ON artwork_comments;
CREATE POLICY "Users can edit own comments"
  ON artwork_comments FOR UPDATE
  USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can remove own reactions" ON artwork_reactions;
CREATE POLICY "Users can remove own reactions"
  ON artwork_reactions FOR DELETE
  USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "Family members can add reactions" ON artwork_reactions;
CREATE POLICY "Family members can add reactions"
  ON artwork_reactions FOR INSERT
  WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM artworks a
  WHERE ((a.id = artwork_reactions.artwork_id) AND is_family_member(a.family_id))))));

DROP POLICY IF EXISTS "Family members can view reactions" ON artwork_reactions;
CREATE POLICY "Family members can view reactions"
  ON artwork_reactions FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM artworks a
  WHERE ((a.id = artwork_reactions.artwork_id) AND is_family_member(a.family_id)))));

DROP POLICY IF EXISTS "Owners/parents can delete artworks" ON artworks;
CREATE POLICY "Owners/parents can delete artworks"
  ON artworks FOR DELETE
  USING ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])));

DROP POLICY IF EXISTS "Members can add artworks" ON artworks;
CREATE POLICY "Members can add artworks"
  ON artworks FOR INSERT
  WITH CHECK ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text, 'member'::text])));

DROP POLICY IF EXISTS "Family members can view artworks" ON artworks;
CREATE POLICY "Family members can view artworks"
  ON artworks FOR SELECT
  USING (is_family_member(family_id));

DROP POLICY IF EXISTS "Owners/parents can update artworks" ON artworks;
CREATE POLICY "Owners/parents can update artworks"
  ON artworks FOR UPDATE
  USING ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])));

DROP POLICY IF EXISTS "Owners/parents can delete children" ON children;
CREATE POLICY "Owners/parents can delete children"
  ON children FOR DELETE
  USING ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])));

DROP POLICY IF EXISTS "Owners/parents can add children" ON children;
CREATE POLICY "Owners/parents can add children"
  ON children FOR INSERT
  WITH CHECK ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])));

DROP POLICY IF EXISTS "Family members can view children" ON children;
CREATE POLICY "Family members can view children"
  ON children FOR SELECT
  USING (is_family_member(family_id));

DROP POLICY IF EXISTS "Owners/parents can update children" ON children;
CREATE POLICY "Owners/parents can update children"
  ON children FOR UPDATE
  USING ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])));

DROP POLICY IF EXISTS "Members can manage collection artworks" ON collection_artworks;
CREATE POLICY "Members can manage collection artworks"
  ON collection_artworks FOR ALL
  USING ((EXISTS ( SELECT 1
   FROM collections c
  WHERE ((c.id = collection_artworks.collection_id) AND (get_family_role(c.family_id) = ANY (ARRAY['owner'::text, 'parent'::text, 'member'::text]))))));

DROP POLICY IF EXISTS "Family members can view collection artworks" ON collection_artworks;
CREATE POLICY "Family members can view collection artworks"
  ON collection_artworks FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM collections c
  WHERE ((c.id = collection_artworks.collection_id) AND is_family_member(c.family_id)))));

DROP POLICY IF EXISTS "Owners/parents can delete collections" ON collections;
CREATE POLICY "Owners/parents can delete collections"
  ON collections FOR DELETE
  USING ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])));

DROP POLICY IF EXISTS "Members can create collections" ON collections;
CREATE POLICY "Members can create collections"
  ON collections FOR INSERT
  WITH CHECK ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text, 'member'::text])));

DROP POLICY IF EXISTS "Family members can view collections" ON collections;
CREATE POLICY "Family members can view collections"
  ON collections FOR SELECT
  USING (is_family_member(family_id));

DROP POLICY IF EXISTS "Owners/parents can update collections" ON collections;
CREATE POLICY "Owners/parents can update collections"
  ON collections FOR UPDATE
  USING ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])));

DROP POLICY IF EXISTS "Owners can delete families" ON families;
CREATE POLICY "Owners can delete families"
  ON families FOR DELETE
  USING ((get_family_role(id) = 'owner'::text));

DROP POLICY IF EXISTS "Users can create families" ON families;
CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK ((auth.uid() = created_by));

DROP POLICY IF EXISTS "Users can view their families" ON families;
CREATE POLICY "Users can view their families"
  ON families FOR SELECT
  USING (is_family_member(id));

DROP POLICY IF EXISTS "Owners can update families" ON families;
CREATE POLICY "Owners can update families"
  ON families FOR UPDATE
  USING ((get_family_role(id) = 'owner'::text));

DROP POLICY IF EXISTS "Owners/parents can delete invites" ON family_invites;
CREATE POLICY "Owners/parents can delete invites"
  ON family_invites FOR DELETE
  USING ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])));

DROP POLICY IF EXISTS "Owners/parents can create invites" ON family_invites;
CREATE POLICY "Owners/parents can create invites"
  ON family_invites FOR INSERT
  WITH CHECK ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])));

DROP POLICY IF EXISTS "Family members can view invites" ON family_invites;
CREATE POLICY "Family members can view invites"
  ON family_invites FOR SELECT
  USING ((is_family_member(family_id) OR (used_at IS NULL)));

DROP POLICY IF EXISTS "Anyone can use valid invites" ON family_invites;
CREATE POLICY "Anyone can use valid invites"
  ON family_invites FOR UPDATE
  USING (((used_at IS NULL) AND (expires_at > now())));

DROP POLICY IF EXISTS "Owners/parents can remove members" ON family_members;
CREATE POLICY "Owners/parents can remove members"
  ON family_members FOR DELETE
  USING (((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])) OR (user_id = auth.uid())));

DROP POLICY IF EXISTS "Owners/parents can add members" ON family_members;
CREATE POLICY "Owners/parents can add members"
  ON family_members FOR INSERT
  WITH CHECK (((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])) OR (auth.uid() = user_id)));

DROP POLICY IF EXISTS "Users can view family members" ON family_members;
CREATE POLICY "Users can view family members"
  ON family_members FOR SELECT
  USING (is_family_member(family_id));

DROP POLICY IF EXISTS "Owners/parents can update members" ON family_members;
CREATE POLICY "Owners/parents can update members"
  ON family_members FOR UPDATE
  USING ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])));

DROP POLICY IF EXISTS "Owners/parents can delete share links" ON share_links;
CREATE POLICY "Owners/parents can delete share links"
  ON share_links FOR DELETE
  USING ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text])));

DROP POLICY IF EXISTS "Members can create share links" ON share_links;
CREATE POLICY "Members can create share links"
  ON share_links FOR INSERT
  WITH CHECK ((get_family_role(family_id) = ANY (ARRAY['owner'::text, 'parent'::text, 'member'::text])));

DROP POLICY IF EXISTS "Family members can view share links" ON share_links;
CREATE POLICY "Family members can view share links"
  ON share_links FOR SELECT
  USING ((is_family_member(family_id) OR true));

DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING ((user_id = auth.uid()));


-- ---------- POLICIES (storage) ----------
-- Both buckets are public-read, so /object/public/... bypasses RLS and keeps
-- serving images to the shipped iOS build and the unauthenticated
-- /share/[code] page. These policies govern listing, upload and delete, which
-- is what stops anonymous enumeration of family folders.

DROP POLICY IF EXISTS "Family members can delete artwork files" ON storage.objects;
CREATE POLICY "Family members can delete artwork files"
  ON storage.objects FOR DELETE TO authenticated
  USING (((bucket_id = 'artworks'::text) AND ((storage.foldername(name))[1] IN ( SELECT (family_members.family_id)::text AS family_id
   FROM family_members
  WHERE (family_members.user_id = auth.uid())))));

DROP POLICY IF EXISTS "Family members can upload artworks" ON storage.objects;
CREATE POLICY "Family members can upload artworks"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'artworks'::text) AND ((storage.foldername(name))[1] IN ( SELECT (family_members.family_id)::text AS family_id
   FROM family_members
  WHERE (family_members.user_id = auth.uid())))));

DROP POLICY IF EXISTS "Family members can view artwork files" ON storage.objects;
CREATE POLICY "Family members can view artwork files"
  ON storage.objects FOR SELECT TO authenticated
  USING (((bucket_id = 'artworks'::text) AND ((storage.foldername(name))[1] IN ( SELECT (family_members.family_id)::text AS family_id
   FROM family_members
  WHERE (family_members.user_id = auth.uid())))));

DROP POLICY IF EXISTS "Family members can view voice note files" ON storage.objects;
CREATE POLICY "Family members can view voice note files"
  ON storage.objects FOR SELECT TO authenticated
  USING (((bucket_id = 'voice-notes'::text) AND ((storage.foldername(name))[1] IN ( SELECT (family_members.family_id)::text AS family_id
   FROM family_members
  WHERE (family_members.user_id = auth.uid())))));

