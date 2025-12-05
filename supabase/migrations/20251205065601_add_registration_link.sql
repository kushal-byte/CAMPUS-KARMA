-- Add registration_link column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_link TEXT;
