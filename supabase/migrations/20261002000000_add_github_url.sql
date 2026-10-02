-- Add github_url to fonts table to support direct filtering from the UI catalog
ALTER TABLE fonts 
ADD COLUMN IF NOT EXISTS github_url TEXT;

-- Add github_url to font_research table for completeness
ALTER TABLE font_research 
ADD COLUMN IF NOT EXISTS github_url TEXT;
