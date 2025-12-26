-- Add photo column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo VARCHAR(255) DEFAULT NULL;
