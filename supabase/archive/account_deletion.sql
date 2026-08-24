-- KidCanvas account deletion (App Store Guideline 5.1.1(v)).
-- Deletes the signed-in user's account and all data they own, in one call.
-- Idempotent: safe to run any number of times.

CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
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
$$;

REVOKE ALL ON FUNCTION delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;
