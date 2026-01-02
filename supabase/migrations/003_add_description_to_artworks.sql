-- Add description column to artworks table
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS description TEXT;

