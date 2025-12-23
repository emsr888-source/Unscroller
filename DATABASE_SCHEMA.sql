-- ================================================
-- UNSCROLLER DATABASE SCHEMA
-- Complete schema for all retention features
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USERS & PROFILES
-- ================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Progress tracking
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_time_saved_minutes INTEGER DEFAULT 0,
  total_focus_sessions INTEGER DEFAULT 0,
  total_stars_earned INTEGER DEFAULT 0,
  
  -- Settings
  timezone TEXT DEFAULT 'UTC',
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  notifications_enabled BOOLEAN DEFAULT true,
  
  -- Onboarding
  goals TEXT[] DEFAULT '{}',
  completed_onboarding BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE
);

-- User daily stats (for analytics and weekly reports)
CREATE TABLE IF NOT EXISTS user_daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  time_saved_minutes INTEGER DEFAULT 0,
  focus_sessions_completed INTEGER DEFAULT 0,
  feeds_blocked INTEGER DEFAULT 0,
  stars_earned INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  goals_completed INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

CREATE INDEX idx_user_daily_stats_user_date ON user_daily_stats(user_id, date DESC);

-- ================================================
-- CHALLENGES & GAMIFICATION
-- ================================================

-- Challenges definition
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('personal', 'community', 'event')),
  
  -- Goal configuration
  metric TEXT NOT NULL CHECK (metric IN ('feed_free_days', 'focus_hours', 'time_saved', 'streak_days')),
  target INTEGER NOT NULL,
  
  -- Timing
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Rewards
  reward_type TEXT NOT NULL CHECK (reward_type IN ('xp', 'badge', 'level')),
  reward_value TEXT NOT NULL,
  
  -- Stats
  total_participants INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenge participation
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_active ON user_challenges(user_id, completed);

-- Leaderboards (materialized view, refreshed periodically)
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  metric TEXT NOT NULL CHECK (metric IN ('time_saved', 'focus_hours', 'streak_days')),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  score INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, metric, period)
);

CREATE INDEX idx_leaderboard_metric_period_rank ON leaderboard_entries(metric, period, rank);

-- ================================================
-- CONSTELLATION SYSTEM
-- ================================================

-- Constellation types
CREATE TABLE IF NOT EXISTS constellations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deep_work', 'better_sleep', 'relationships', 'self_confidence', 'creativity', 'physical_health')),
  
  stars_count INTEGER DEFAULT 0,
  progress NUMERIC(5,2) DEFAULT 0, -- 0-100
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, type)
);

-- Individual stars
CREATE TABLE IF NOT EXISTS stars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  constellation_id UUID NOT NULL REFERENCES constellations(id) ON DELETE CASCADE,
  
  -- Position in sky (0-1 normalized)
  position_x NUMERIC(5,4) NOT NULL,
  position_y NUMERIC(5,4) NOT NULL,
  
  -- Star properties
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
  type TEXT NOT NULL CHECK (type IN ('focus_session', 'time_saved', 'goal_completed', 'milestone')),
  brightness NUMERIC(3,2) DEFAULT 0.8,
  
  -- What earned this star
  action_description TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stars_user ON stars(user_id);
CREATE INDEX idx_stars_constellation ON stars(constellation_id);
CREATE INDEX idx_stars_created ON stars(created_at DESC);

-- Sky state (for features like aurora, cloud cover)
CREATE TABLE IF NOT EXISTS sky_states (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  cloud_cover NUMERIC(3,2) DEFAULT 0, -- 0-1
  has_aurora BOOLEAN DEFAULT false,
  has_shooting_stars BOOLEAN DEFAULT false,
  sky_theme TEXT DEFAULT 'default' CHECK (sky_theme IN ('default', 'northern', 'tropical', 'cosmic')),
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- BUDDY SYSTEM
-- ================================================

-- Buddy relationships
CREATE TABLE IF NOT EXISTS buddy_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  compatibility_score INTEGER,
  
  paired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (user_id_1 < user_id_2), -- Ensure consistent ordering
  UNIQUE(user_id_1, user_id_2)
);

CREATE INDEX idx_buddy_pairs_user1 ON buddy_pairs(user_id_1);
CREATE INDEX idx_buddy_pairs_user2 ON buddy_pairs(user_id_2);

-- Buddy requests
CREATE TABLE IF NOT EXISTS buddy_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_buddy_requests_to_user ON buddy_requests(to_user_id, status);

-- Buddy activity feed
CREATE TABLE IF NOT EXISTS buddy_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('streak_milestone', 'challenge_complete', 'level_up', 'constellation_complete')),
  
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_buddy_activities_user_created ON buddy_activities(user_id, created_at DESC);

-- ================================================
-- NOTIFICATIONS
-- ================================================

-- Notification settings
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  enabled BOOLEAN DEFAULT true,
  focus_reminders BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  milestone_notifications BOOLEAN DEFAULT true,
  community_updates BOOLEAN DEFAULT false,
  
  typical_scroll_time TIME,
  preferred_focus_time TIME,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled notifications (for tracking what's been sent)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notification_logs_user ON notification_logs(user_id, sent_at DESC);

-- ================================================
-- AI CHAT HISTORY
-- ================================================

-- AI conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);

-- ================================================
-- WEEKLY REPORTS
-- ================================================

-- Track sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  email_type TEXT NOT NULL CHECK (email_type IN ('weekly_progress', 'milestone', 're_engagement')),
  subject TEXT NOT NULL,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_email_logs_user ON email_logs(user_id, sent_at DESC);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update constellation progress
CREATE OR REPLACE FUNCTION update_constellation_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE constellations
  SET 
    stars_count = (SELECT COUNT(*) FROM stars WHERE constellation_id = NEW.constellation_id),
    progress = (SELECT COUNT(*) FROM stars WHERE constellation_id = NEW.constellation_id) * 100.0 / 30,
    completed = (SELECT COUNT(*) FROM stars WHERE constellation_id = NEW.constellation_id) >= 30,
    completed_at = CASE 
      WHEN (SELECT COUNT(*) FROM stars WHERE constellation_id = NEW.constellation_id) >= 30 
        AND completed = false 
      THEN NOW() 
      ELSE completed_at 
    END
  WHERE id = NEW.constellation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_constellation_progress_trigger AFTER INSERT ON stars
  FOR EACH ROW EXECUTE FUNCTION update_constellation_progress();

-- Update sky features based on progress
CREATE OR REPLACE FUNCTION update_sky_features()
RETURNS TRIGGER AS $$
BEGIN
  -- Aurora unlocks at 30-day streak
  IF NEW.current_streak >= 30 THEN
    UPDATE sky_states SET has_aurora = true WHERE user_id = NEW.id;
  END IF;
  
  -- Shooting stars unlock at 100 total stars
  IF NEW.total_stars_earned >= 100 THEN
    UPDATE sky_states SET has_shooting_stars = true WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sky_features_trigger AFTER UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_sky_features();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE constellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE sky_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own stats" ON user_daily_stats
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own challenges" ON user_challenges
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own constellations" ON constellations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stars" ON stars
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sky" ON sky_states
  FOR ALL USING (auth.uid() = user_id);

-- Buddy policies: Can see buddy's public data
CREATE POLICY "Users can view buddy relationships" ON buddy_pairs
  FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can view buddy requests" ON buddy_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create buddy requests" ON buddy_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update received requests" ON buddy_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notification_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification logs" ON notification_logs
  FOR ALL USING (auth.uid() = user_id);

-- AI Chat
CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON ai_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM ai_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

-- Email logs (read-only for users)
CREATE POLICY "Users can view own emails" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================

-- User progress summary
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
  up.id,
  up.username,
  up.avatar,
  up.total_xp,
  up.current_level,
  up.current_streak,
  up.longest_streak,
  up.total_time_saved_minutes,
  up.total_focus_sessions,
  up.total_stars_earned,
  (SELECT COUNT(*) FROM user_challenges uc WHERE uc.user_id = up.id AND uc.completed = true) as challenges_completed,
  (SELECT COUNT(*) FROM constellations c WHERE c.user_id = up.id AND c.completed = true) as constellations_completed
FROM user_profiles up;

-- Weekly progress for emails
CREATE OR REPLACE VIEW user_weekly_progress AS
SELECT 
  up.id as user_id,
  up.username,
  SUM(uds.time_saved_minutes) / 60.0 as time_saved_hours,
  SUM(uds.focus_sessions_completed) as focus_sessions,
  SUM(uds.stars_earned) as stars_earned,
  up.current_streak as streak_days,
  up.current_level as level
FROM user_profiles up
LEFT JOIN user_daily_stats uds ON uds.user_id = up.id
WHERE uds.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY up.id, up.username, up.current_streak, up.current_level;

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

CREATE INDEX idx_user_profiles_level ON user_profiles(current_level DESC);
CREATE INDEX idx_user_profiles_streak ON user_profiles(current_streak DESC);
CREATE INDEX idx_user_profiles_xp ON user_profiles(total_xp DESC);
CREATE INDEX idx_challenges_active_dates ON challenges(is_active, start_date, end_date);
CREATE INDEX idx_constellations_user_type ON constellations(user_id, type);

-- ================================================
-- SEED DATA (Optional - for development)
-- ================================================

-- Insert default challenges
INSERT INTO challenges (title, description, type, metric, target, start_date, end_date, reward_type, reward_value)
VALUES 
  ('7 Days Feed-Free', 'Go one week without scrolling any social media feeds', 'personal', 'feed_free_days', 7, NOW(), NOW() + INTERVAL '7 days', 'badge', 'feed_free_warrior'),
  ('Complete 10 Focus Sessions', 'Finish 10 focused work sessions this week', 'personal', 'focus_hours', 10, NOW(), NOW() + INTERVAL '7 days', 'xp', '200'),
  ('Community Goal: 100K Hours', 'Save 100,000 collective hours as a community this month', 'community', 'time_saved', 100000, NOW(), NOW() + INTERVAL '30 days', 'badge', 'community_champion')
ON CONFLICT DO NOTHING;

COMMENT ON DATABASE postgres IS 'Unscroller - Digital Wellness App Database';
