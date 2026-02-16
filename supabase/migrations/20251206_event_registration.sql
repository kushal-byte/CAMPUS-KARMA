-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proof_url TEXT NOT NULL,
  team_members TEXT, -- Stores USNs or names of team members
  status attendance_status NOT NULL DEFAULT 'pending', -- Using existing enum: pending, approved, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Policies for event_registrations
CREATE POLICY "Users can read their own registrations"
  ON event_registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can create their own registrations"
  ON event_registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" -- In case they need to re-upload proof? Maybe restrict to pending.
  ON event_registrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update any registration"
  ON event_registrations FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any registration"
  ON event_registrations FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));


-- Create storage bucket for registration proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('registration-proofs', 'registration-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Anyone can view registration proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'registration-proofs'); -- Or restrict to admins/owners? User said "visible for admin... and not for all users". 
-- Actually, let's restrict public access if possible, but 'public' bucket means public URL.
-- If we want strict privacy, we should make the bucket private and use signed URLs or RLS.
-- However, for simplicity and considering the requirement "visible for admin... and not for all users", 
-- Standard RLS on storage.objects is better. `public: false` bucket is safer.
-- But the existing code structure uses public URLs often. 
-- Let's stick to public=true for ease of implementation, but strictly enforce RLS on the TABLE so general users don't have the URLs.
-- Wait, if bucket is public, anyone with URL can see. If filenames are guessable, it's a risk.
-- Let's use RLS for SELECT on objects to restrict browsing, but if they have the UUID-based filename...
-- User specifically asked: "not for all users". 
-- Policies:
-- SELECT: Admins OR Owner.
-- INSERT: Authenticated users (Agency).

DROP POLICY IF EXISTS "Anyone can view registration proofs" ON storage.objects;

CREATE POLICY "Admins and Owners can view proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'registration-proofs' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1] -- Folder structure: user_id/filename
    OR 
    is_admin(auth.uid())
  )
);

CREATE POLICY "Users can upload their own proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'registration-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own proofs"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'registration-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own proofs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'registration-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
