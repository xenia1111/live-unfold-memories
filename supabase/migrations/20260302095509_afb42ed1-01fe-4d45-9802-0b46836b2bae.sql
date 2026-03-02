
-- Add stats and client tracking to cat_profiles for global leaderboard
ALTER TABLE public.cat_profiles 
  ADD COLUMN client_id TEXT UNIQUE,
  ADD COLUMN completed_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN photo_count INTEGER NOT NULL DEFAULT 0;

-- Update the existing row with a placeholder client_id
UPDATE public.cat_profiles SET client_id = 'legacy' WHERE client_id IS NULL;
