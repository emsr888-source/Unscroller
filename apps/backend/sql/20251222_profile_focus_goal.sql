-- Add focus_goal column for 30-day focus tracking
ALTER TABLE IF EXISTS user_profiles
ADD COLUMN IF NOT EXISTS focus_goal TEXT;
