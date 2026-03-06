
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Allow anyone to upload avatars
CREATE POLICY "Allow public upload to avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Allow anyone to read avatars
CREATE POLICY "Allow public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow anyone to update their avatars
CREATE POLICY "Allow public update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

-- Allow anyone to delete avatars
CREATE POLICY "Allow public delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
