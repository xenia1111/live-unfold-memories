-- Edge function will handle deletion, but we need DELETE policies on profiles and cat_profiles
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can delete own cat" ON public.cat_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ai stories" ON public.ai_stories FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own story notes" ON public.story_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);