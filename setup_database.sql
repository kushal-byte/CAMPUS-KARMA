-- Complete database setup for Campus Karma Hub
-- Run this in your Supabase SQL Editor
-- WARNING: This will DROP all existing tables and data!

-- Drop all existing tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS generated_posts CASCADE;
DROP TABLE IF EXISTS linkedin_post_templates CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all existing functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_admin(_user_id UUID) CASCADE;

-- Drop all existing types
DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS listing_status CASCADE;
DROP TYPE IF EXISTS listing_condition CASCADE;
DROP TYPE IF EXISTS listing_category CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS post_type CASCADE;

-- Drop storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view linkedin images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own linkedin images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own linkedin images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own linkedin images" ON storage.objects;

-- Delete storage bucket
DELETE FROM storage.buckets WHERE id = 'linkedin-images';

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('STUDENT', 'ADMIN');

-- Create enum for listing status
CREATE TYPE listing_status AS ENUM ('active', 'sold');

-- Create enum for listing condition
CREATE TYPE listing_condition AS ENUM ('new', 'like_new', 'used');

-- Create enum for listing category
CREATE TYPE listing_category AS ENUM ('bag', 'calculator', 'books', 'electronics', 'others');

-- Create enum for transaction status
CREATE TYPE transaction_status AS ENUM ('pending', 'paid', 'failed');

-- Create enum for attendance status
CREATE TYPE attendance_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for post type
CREATE TYPE post_type AS ENUM ('hackathon', 'event', 'project', 'achievement');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'STUDENT',
  college TEXT,
  branch TEXT,
  year INTEGER,
  bio TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category listing_category NOT NULL,
  images TEXT[] DEFAULT '{}',
  original_price DECIMAL(10,2) NOT NULL,
  expected_price DECIMAL(10,2) NOT NULL,
  condition listing_condition NOT NULL,
  status listing_status NOT NULL DEFAULT 'active',
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  radius_meters INTEGER NOT NULL DEFAULT 100,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  banner_image_url TEXT,
  created_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create attendances table
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  selfie_url TEXT,
  certificate_url TEXT,
  status attendance_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create linkedin_post_templates table
CREATE TABLE linkedin_post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type post_type NOT NULL,
  base_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create generated_posts table
CREATE TABLE generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- image_url column is already included in the generated_posts table creation above

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_post_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_posts ENABLE ROW LEVEL SECURITY;

-- Create function to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists(_user_id UUID, _email TEXT, _name TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    _user_id,
    COALESCE(_name, split_part(_email, '@', 1), 'User'),
    _email,
    'STUDENT'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(_name, split_part(_email, '@', 1), profiles.name),
    email = _email,
    updated_at = NOW();
END;
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _user_id AND role = 'ADMIN'
  );
$$;

-- Profiles policies
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Listings policies
CREATE POLICY "Anyone can read active listings"
  ON listings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Transactions policies
CREATE POLICY "Users can read their own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() IN (SELECT seller_id FROM listings WHERE id = listing_id));

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Events policies
CREATE POLICY "Anyone can read events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Attendances policies
CREATE POLICY "Users can read their own attendance"
  ON attendances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can create their own attendance"
  ON attendances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance"
  ON attendances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any attendance"
  ON attendances FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- LinkedIn post templates policies
CREATE POLICY "Users can read their own templates"
  ON linkedin_post_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON linkedin_post_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Generated posts policies
CREATE POLICY "Users can read their own posts"
  ON generated_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own posts"
  ON generated_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON generated_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    COALESCE(NEW.email, ''),
    'STUDENT'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    email = COALESCE(NEW.email, ''),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Admin user will be created through the app signup process
-- After running this script and creating a user through the app,
-- you can update their role to ADMIN using the following query:
-- 
-- UPDATE profiles SET role = 'ADMIN' WHERE email = 'your-email@example.com';