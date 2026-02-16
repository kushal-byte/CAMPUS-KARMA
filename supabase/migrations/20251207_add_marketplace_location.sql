-- Add meetup_location column to listings table
ALTER TABLE listings 
ADD COLUMN meetup_location text;

-- Make it required for new listings (optional, but good practice if we want to enforce it)
-- For now, we'll leave it nullable to support existing listings, but enforce it in the UI
