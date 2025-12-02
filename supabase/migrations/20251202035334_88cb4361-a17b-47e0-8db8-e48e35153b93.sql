-- Create storage buckets for event attendance
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('event-selfies', 'event-selfies', true),
  ('event-certificates', 'event-certificates', true);

-- RLS policies for event-selfies bucket
CREATE POLICY "Anyone can view selfies"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-selfies');

CREATE POLICY "Users can upload their own selfies"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-selfies' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own selfies"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-selfies' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own selfies"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-selfies' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for event-certificates bucket
CREATE POLICY "Anyone can view certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-certificates');

CREATE POLICY "Users can upload their own certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-certificates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own certificates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-certificates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-certificates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);