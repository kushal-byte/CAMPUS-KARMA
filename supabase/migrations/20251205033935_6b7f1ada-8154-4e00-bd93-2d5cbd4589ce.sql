-- Add image_url column to generated_posts table
ALTER TABLE public.generated_posts 
ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for LinkedIn post images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('linkedin-images', 'linkedin-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for linkedin-images bucket
CREATE POLICY "Anyone can view linkedin images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'linkedin-images');

CREATE POLICY "Users can upload their own linkedin images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'linkedin-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own linkedin images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'linkedin-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own linkedin images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'linkedin-images' AND auth.uid()::text = (storage.foldername(name))[1]);