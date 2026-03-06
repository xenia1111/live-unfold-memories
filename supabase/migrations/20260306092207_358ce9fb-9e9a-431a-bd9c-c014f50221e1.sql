
-- Add unique constraints for upsert operations
ALTER TABLE public.story_notes ADD CONSTRAINT story_notes_user_period UNIQUE (user_id, period_key);
ALTER TABLE public.ai_stories ADD CONSTRAINT ai_stories_user_period UNIQUE (user_id, period_key);
