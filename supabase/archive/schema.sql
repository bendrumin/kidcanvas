-- KidCanvas Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Family members (links users to families with roles)
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'parent', 'member', 'viewer')),
  nickname TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Family invites
CREATE TABLE IF NOT EXISTS family_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'member', 'viewer')),
  nickname TEXT,
  invited_email TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children profiles
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artworks
CREATE TABLE IF NOT EXISTS artworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_date DATE NOT NULL,
  child_age_months INTEGER,
  tags TEXT[] DEFAULT '{}',
  ai_tags TEXT[] DEFAULT '{}',
  ai_description TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cover_artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection artworks (many-to-many)
CREATE TABLE IF NOT EXISTS collection_artworks (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, artwork_id)
);

-- Share links for public sharing
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('artwork', 'collection')),
  resource_id UUID NOT NULL,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_children_family_id ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_artworks_family_id ON artworks(family_id);
CREATE INDEX IF NOT EXISTS idx_artworks_child_id ON artworks(child_id);
CREATE INDEX IF NOT EXISTS idx_artworks_created_date ON artworks(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_is_favorite ON artworks(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_family_invites_code ON family_invites(code);
CREATE INDEX IF NOT EXISTS idx_share_links_code ON share_links(code);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is a family member
CREATE OR REPLACE FUNCTION is_family_member(family_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = family_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role in a family
CREATE OR REPLACE FUNCTION get_family_role(family_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM family_members
  WHERE family_id = family_uuid
  AND user_id = auth.uid();
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Families policies
CREATE POLICY "Users can view their families"
  ON families FOR SELECT
  USING (is_family_member(id));

CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update families"
  ON families FOR UPDATE
  USING (get_family_role(id) = 'owner');

CREATE POLICY "Owners can delete families"
  ON families FOR DELETE
  USING (get_family_role(id) = 'owner');

-- Family members policies
CREATE POLICY "Users can view family members"
  ON family_members FOR SELECT
  USING (is_family_member(family_id));

CREATE POLICY "Owners/parents can add members"
  ON family_members FOR INSERT
  WITH CHECK (
    get_family_role(family_id) IN ('owner', 'parent')
    OR (auth.uid() = user_id) -- Allow users to join via invite
  );

CREATE POLICY "Owners/parents can update members"
  ON family_members FOR UPDATE
  USING (get_family_role(family_id) IN ('owner', 'parent'));

CREATE POLICY "Owners/parents can remove members"
  ON family_members FOR DELETE
  USING (
    get_family_role(family_id) IN ('owner', 'parent')
    OR user_id = auth.uid() -- Users can leave
  );

-- Family invites policies
CREATE POLICY "Family members can view invites"
  ON family_invites FOR SELECT
  USING (is_family_member(family_id) OR used_at IS NULL);

CREATE POLICY "Owners/parents can create invites"
  ON family_invites FOR INSERT
  WITH CHECK (get_family_role(family_id) IN ('owner', 'parent'));

CREATE POLICY "Anyone can use valid invites"
  ON family_invites FOR UPDATE
  USING (used_at IS NULL AND expires_at > NOW());

CREATE POLICY "Owners/parents can delete invites"
  ON family_invites FOR DELETE
  USING (get_family_role(family_id) IN ('owner', 'parent'));

-- Children policies
CREATE POLICY "Family members can view children"
  ON children FOR SELECT
  USING (is_family_member(family_id));

CREATE POLICY "Owners/parents can add children"
  ON children FOR INSERT
  WITH CHECK (get_family_role(family_id) IN ('owner', 'parent'));

CREATE POLICY "Owners/parents can update children"
  ON children FOR UPDATE
  USING (get_family_role(family_id) IN ('owner', 'parent'));

CREATE POLICY "Owners/parents can delete children"
  ON children FOR DELETE
  USING (get_family_role(family_id) IN ('owner', 'parent'));

-- Artworks policies
CREATE POLICY "Family members can view artworks"
  ON artworks FOR SELECT
  USING (is_family_member(family_id));

CREATE POLICY "Members can add artworks"
  ON artworks FOR INSERT
  WITH CHECK (get_family_role(family_id) IN ('owner', 'parent', 'member'));

CREATE POLICY "Owners/parents can update artworks"
  ON artworks FOR UPDATE
  USING (get_family_role(family_id) IN ('owner', 'parent'));

CREATE POLICY "Owners/parents can delete artworks"
  ON artworks FOR DELETE
  USING (get_family_role(family_id) IN ('owner', 'parent'));

-- Collections policies
CREATE POLICY "Family members can view collections"
  ON collections FOR SELECT
  USING (is_family_member(family_id));

CREATE POLICY "Members can create collections"
  ON collections FOR INSERT
  WITH CHECK (get_family_role(family_id) IN ('owner', 'parent', 'member'));

CREATE POLICY "Owners/parents can update collections"
  ON collections FOR UPDATE
  USING (get_family_role(family_id) IN ('owner', 'parent'));

CREATE POLICY "Owners/parents can delete collections"
  ON collections FOR DELETE
  USING (get_family_role(family_id) IN ('owner', 'parent'));

-- Collection artworks policies
CREATE POLICY "Family members can view collection artworks"
  ON collection_artworks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id
      AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "Members can manage collection artworks"
  ON collection_artworks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id
      AND get_family_role(c.family_id) IN ('owner', 'parent', 'member')
    )
  );

-- Share links policies
CREATE POLICY "Family members can view share links"
  ON share_links FOR SELECT
  USING (is_family_member(family_id) OR TRUE); -- Public can view by code

CREATE POLICY "Members can create share links"
  ON share_links FOR INSERT
  WITH CHECK (get_family_role(family_id) IN ('owner', 'parent', 'member'));

CREATE POLICY "Owners/parents can delete share links"
  ON share_links FOR DELETE
  USING (get_family_role(family_id) IN ('owner', 'parent'));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate child age in months at artwork creation
CREATE OR REPLACE FUNCTION calculate_child_age_months()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate child age
CREATE TRIGGER set_child_age_months
  BEFORE INSERT OR UPDATE ON artworks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_child_age_months();

-- Function to create family and add owner on signup
CREATE OR REPLACE FUNCTION create_family_for_user(family_name TEXT)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an invite
CREATE OR REPLACE FUNCTION accept_family_invite(invite_code TEXT, member_nickname TEXT DEFAULT NULL)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

