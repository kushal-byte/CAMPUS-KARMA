-- Add team_size column to event_registrations
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1;

-- Add check constraint to ensure team_size is positive
ALTER TABLE event_registrations
ADD CONSTRAINT event_registrations_team_size_check CHECK (team_size > 0);
