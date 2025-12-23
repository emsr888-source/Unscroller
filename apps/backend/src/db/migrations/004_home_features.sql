-- Home Screen Features Migration
-- Creates tables for streak tracking, scroll-free time, creation progress, and daily check-ins

-- User Streaks Table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_in TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Scroll-Free Time Tracking
CREATE TABLE IF NOT EXISTS scroll_free_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  total_hours INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Creation Progress Tracking
CREATE TABLE IF NOT EXISTS creation_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Daily Check-ins
CREATE TABLE IF NOT EXISTS daily_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  check_in_date DATE NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, check_in_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_scroll_free_time_user_id ON scroll_free_time(user_id);
CREATE INDEX IF NOT EXISTS idx_creation_progress_user_id ON creation_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_id ON daily_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_date ON daily_check_ins(check_in_date);

-- Enable Row Level Security
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scroll_free_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE creation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_streaks (SECURE MULTI-TENANT)
CREATE POLICY user_streaks_select ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_streaks_insert ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_streaks_update ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for scroll_free_time (SECURE MULTI-TENANT)
CREATE POLICY scroll_free_time_select ON scroll_free_time
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY scroll_free_time_insert ON scroll_free_time
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY scroll_free_time_update ON scroll_free_time
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for creation_progress (SECURE MULTI-TENANT)
CREATE POLICY creation_progress_select ON creation_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY creation_progress_insert ON creation_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY creation_progress_update ON creation_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for daily_check_ins (SECURE MULTI-TENANT)
CREATE POLICY daily_check_ins_select ON daily_check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY daily_check_ins_insert ON daily_check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY daily_check_ins_update ON daily_check_ins
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creation_progress_updated_at
  BEFORE UPDATE ON creation_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
