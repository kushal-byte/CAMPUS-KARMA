-- Consolidated Marketplace Update: Location and Mobile
-- Run this in your Supabase SQL Editor to apply changes

-- 1. Add meetup_location column
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS meetup_location text;

-- 2. Add mobile column
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS mobile text;

-- 3. (Optional) Force schema cache reload (Supabase usually does this automatically on DDL)
NOTIFY pgrst, 'reload config';
