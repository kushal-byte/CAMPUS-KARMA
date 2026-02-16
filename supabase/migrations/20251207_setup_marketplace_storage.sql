-- Create storage bucket for marketplace listing images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('marketplace-images', 'marketplace-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for marketplace-images bucket

-- Anyone can view marketplace images
DROP POLICY IF EXISTS "Anyone can view marketplace images" ON storage.objects;
CREATE POLICY "Anyone can view marketplace images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'marketplace-images');

-- Users can upload their own marketplace images
DROP POLICY IF EXISTS "Users can upload their own marketplace images" ON storage.objects;
CREATE POLICY "Users can upload their own marketplace images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'marketplace-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own marketplace images
DROP POLICY IF EXISTS "Users can update their own marketplace images" ON storage.objects;
CREATE POLICY "Users can update their own marketplace images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'marketplace-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own marketplace images
DROP POLICY IF EXISTS "Users can delete their own marketplace images" ON storage.objects;
CREATE POLICY "Users can delete their own marketplace images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'marketplace-images' AND auth.uid()::text = (storage.foldername(name))[1]);
