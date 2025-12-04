/*
  # LinkedIn Images and Admin Features

  1. Schema Changes
    - Add `image_url` column to `generated_posts` table for LinkedIn post images
    
  2. Storage
    - Create storage bucket for LinkedIn post images
    
  3. Security
    - Enable RLS on storage bucket
    - Add policies for authenticated users to upload/view their images
*/

-- Add image_url column to generated_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_posts' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE generated_posts ADD COLUMN image_url text;
  END IF;
END $$;

-- Create storage bucket for LinkedIn post images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('linkedin-images', 'linkedin-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for LinkedIn images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload their LinkedIn images'
  ) THEN
    CREATE POLICY "Users can upload their LinkedIn images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'linkedin-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can view their LinkedIn images'
  ) THEN
    CREATE POLICY "Users can view their LinkedIn images"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'linkedin-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can update their LinkedIn images'
  ) THEN
    CREATE POLICY "Users can update their LinkedIn images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'linkedin-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete their LinkedIn images'
  ) THEN
    CREATE POLICY "Users can delete their LinkedIn images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'linkedin-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public can view LinkedIn images'
  ) THEN
    CREATE POLICY "Public can view LinkedIn images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'linkedin-images');
  END IF;
END $$;
