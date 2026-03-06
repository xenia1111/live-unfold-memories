
-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '探索者',
  gender text,
  birthday date,
  region text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', '探索者'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id to tasks
ALTER TABLE public.tasks ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to cat_profiles
ALTER TABLE public.cat_profiles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to story_notes
ALTER TABLE public.story_notes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to ai_stories
ALTER TABLE public.ai_stories ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all access to cat_profiles" ON public.cat_profiles;
DROP POLICY IF EXISTS "Allow all access to story_notes" ON public.story_notes;
DROP POLICY IF EXISTS "Allow all access to ai_stories" ON public.ai_stories;

-- New RLS policies for tasks
CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- New RLS policies for cat_profiles
CREATE POLICY "Users can view own cat"
  ON public.cat_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cat"
  ON public.cat_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cat"
  ON public.cat_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
-- Public read for leaderboard
CREATE POLICY "Anyone can view cats for leaderboard"
  ON public.cat_profiles FOR SELECT TO authenticated
  USING (true);

-- New RLS policies for story_notes
CREATE POLICY "Users can manage own story notes"
  ON public.story_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- New RLS policies for ai_stories
CREATE POLICY "Users can manage own ai stories"
  ON public.ai_stories FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
