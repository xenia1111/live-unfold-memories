
-- Create storage bucket for task photos
INSERT INTO storage.buckets (id, name, public) VALUES ('task-photos', 'task-photos', true);

-- Allow authenticated users to upload to task-photos bucket
CREATE POLICY "Users can upload task photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view task photos (public bucket)
CREATE POLICY "Public can view task photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'task-photos');

-- Allow users to delete their own task photos
CREATE POLICY "Users can delete own task photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'task-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
