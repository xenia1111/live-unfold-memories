
-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT '全天',
  icon TEXT NOT NULL DEFAULT 'star',
  category TEXT NOT NULL DEFAULT '记录',
  completed BOOLEAN NOT NULL DEFAULT false,
  date DATE,
  deadline DATE,
  cover_image TEXT,
  completion_photo TEXT,
  completion_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story_notes table
CREATE TABLE public.story_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_key TEXT NOT NULL UNIQUE,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_stories table
CREATE TABLE public.ai_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_key TEXT NOT NULL UNIQUE,
  story_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_stories ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth for now)
CREATE POLICY "Allow all access to tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to story_notes" ON public.story_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to ai_stories" ON public.ai_stories FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_story_notes_updated_at BEFORE UPDATE ON public.story_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
