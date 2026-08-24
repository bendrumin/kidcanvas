-- Drop columns for features that do not exist.
--
-- None of these were ever written by any client, and all six were verified
-- empty across every row before this migration was written:
--
--   select count(*) total,
--          count(moment_photo_url), count(ai_description), count(nullif(ai_tags,'{}')),
--          count(voice_note_url), count(voice_duration_seconds), count(voice_uploaded_at)
--   from artworks;
--   -- total 5, every other count 0
--
-- What each one was:
--
--   ai_description, ai_tags  -- the AI tagging route was deleted when AI came
--     out of the product. The columns stayed, and the UI kept rendering an "AI
--     Detected" tag list, an "AI Description" card, a Sparkles "AI analyzed"
--     badge and an "AI Tagged" analytics tile, all permanently empty. Worse,
--     dashboard search matched against ai_description instead of the story, so
--     searching never looked at the text people actually write.
--
--   moment_photo_url  -- displayed in four places on the web and one on iOS,
--     and written by nothing. There has never been a way to add one.
--
--   voice_note_url, voice_duration_seconds, voice_uploaded_at  -- voice notes
--     are gone: the recorder and player were dead code, the upload route had no
--     caller, and the project has no voice-notes bucket.
--
-- The reads that were worth keeping now point at `story`, which is the column
-- the product is actually about: the public /share/[code] page and the gallery
-- lightbox show it (neither displayed it before), the PDF art book prints it,
-- and dashboard search matches it.
--
-- After running this, regenerate the typed client so lib/supabase/types.ts
-- stops declaring columns that no longer exist:
--   supabase gen types typescript --linked > lib/supabase/types.ts

ALTER TABLE artworks
  DROP COLUMN IF EXISTS ai_description,
  DROP COLUMN IF EXISTS ai_tags,
  DROP COLUMN IF EXISTS moment_photo_url,
  DROP COLUMN IF EXISTS voice_note_url,
  DROP COLUMN IF EXISTS voice_duration_seconds,
  DROP COLUMN IF EXISTS voice_uploaded_at;
