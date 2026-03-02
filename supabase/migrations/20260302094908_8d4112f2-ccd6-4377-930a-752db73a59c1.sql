
-- Create cat_profiles table to track cat birth and global ranking
CREATE TABLE public.cat_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cat_name TEXT NOT NULL DEFAULT '小猫咪',
  born_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS with public access (no auth yet)
ALTER TABLE public.cat_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to cat_profiles" ON public.cat_profiles FOR ALL USING (true) WITH CHECK (true);

-- Insert default cat profile
INSERT INTO public.cat_profiles (cat_name) VALUES ('小猫咪');
