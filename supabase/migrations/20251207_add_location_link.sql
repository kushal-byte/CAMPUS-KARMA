-- Add location_link column to events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS location_link TEXT;

-- Make latitude, longitude, and radius_meters nullable if they aren't already (radius_meters has default but let's drop not null constraint if needed, though default handles it)
ALTER TABLE events ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE events ALTER COLUMN longitude DROP NOT NULL;
ALTER TABLE events ALTER COLUMN radius_meters DROP NOT NULL;
