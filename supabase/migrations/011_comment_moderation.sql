-- Let family owners and parents remove any comment in their family.
--
-- App Store Guideline 1.2 expects a user-generated-content app to offer a way to
-- remove objectionable material. The only DELETE policy on artwork_comments was
-- "Users can delete own comments", so a parent could not take down a comment
-- someone else left on their own child's artwork -- there was no moderation path
-- at any layer, and ArtworkService.deleteComment was not even wired to a view.
--
-- This mirrors how artwork deletion already works: owners and parents are the
-- privileged roles, members and viewers are not. Authors keep the existing
-- ability to delete their own comment regardless of role, via the older policy.

DROP POLICY IF EXISTS "Owners and parents can moderate comments" ON artwork_comments;
CREATE POLICY "Owners and parents can moderate comments"
  ON artwork_comments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM artworks a
      JOIN family_members fm ON fm.family_id = a.family_id
      WHERE a.id = artwork_comments.artwork_id
        AND fm.user_id = auth.uid()
        AND fm.role IN ('owner', 'parent')
    )
  );
