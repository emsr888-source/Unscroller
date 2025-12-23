-- Achievements & Challenges Migration
-- Trophies, challenges, and goals tracking

-- Achievement/Trophy Definitions
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,  -- e.g., '7_days_strong', '30_days_sober'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,  -- emoji or image URL
  category TEXT NOT NULL,  -- 'streak', 'build', 'social', 'milestone'
  requirement_type TEXT NOT NULL,  -- 'streak_days', 'projects_shipped', 'posts_count', etc.
  requirement_value INTEGER NOT NULL,
  reward_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements (Unlocked Trophies)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Challenge Definitions
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'daily', 'weekly', 'monthly', 'special'
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  reward_xp INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Challenge Progress
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- User Goals
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL,  -- 'streak', 'projects', 'posts', 'custom'
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  icon TEXT,  -- emoji
  active BOOLEAN DEFAULT TRUE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- XP/Points System
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp_to_next_level INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_active ON user_goals(active);
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);

-- Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY achievements_select ON achievements
  FOR SELECT USING (true);

-- RLS Policies for user_achievements
CREATE POLICY user_achievements_select ON user_achievements
  FOR SELECT USING (true);  -- Can see others' achievements for social features

CREATE POLICY user_achievements_insert ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for challenges (public read)
CREATE POLICY challenges_select ON challenges
  FOR SELECT USING (true);

-- RLS Policies for user_challenges
CREATE POLICY user_challenges_select ON user_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_challenges_insert ON user_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_challenges_update ON user_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_goals
CREATE POLICY user_goals_select ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_goals_insert ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_goals_update ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_goals_delete ON user_goals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_xp
CREATE POLICY user_xp_select ON user_xp
  FOR SELECT USING (true);  -- Can see others' XP/level for leaderboards

CREATE POLICY user_xp_insert ON user_xp
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_xp_update ON user_xp
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to add XP and level up
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp_amount INTEGER)
RETURNS VOID AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_xp_needed INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get current values
  SELECT total_xp, level, xp_to_next_level
  INTO v_current_xp, v_current_level, v_xp_needed
  FROM user_xp
  WHERE user_id = p_user_id;
  
  -- Calculate new XP
  v_new_xp := v_current_xp + p_xp_amount;
  v_new_level := v_current_level;
  
  -- Check for level up (simple: 100 XP per level, increases by 50 each level)
  WHILE v_new_xp >= v_xp_needed LOOP
    v_new_xp := v_new_xp - v_xp_needed;
    v_new_level := v_new_level + 1;
    v_xp_needed := 100 + (v_new_level * 50);  -- Scaling XP requirement
  END LOOP;
  
  -- Update user XP
  UPDATE user_xp
  SET total_xp = v_current_xp + p_xp_amount,
      level = v_new_level,
      xp_to_next_level = v_xp_needed,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create notification if leveled up
  IF v_new_level > v_current_level THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      p_user_id,
      'milestone',
      'Level Up!',
      'Congratulations! You reached level ' || v_new_level
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_unlock_achievement(p_user_id UUID, p_achievement_key TEXT)
RETURNS VOID AS $$
DECLARE
  v_achievement_id UUID;
  v_reward_xp INTEGER;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Get achievement details
  SELECT id, reward_xp INTO v_achievement_id, v_reward_xp
  FROM achievements
  WHERE key = p_achievement_key;
  
  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id
  ) INTO v_already_unlocked;
  
  -- Unlock if not already unlocked
  IF NOT v_already_unlocked THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, v_achievement_id);
    
    -- Add XP reward
    IF v_reward_xp > 0 THEN
      PERFORM add_user_xp(p_user_id, v_reward_xp);
    END IF;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, action_url)
    VALUES (
      p_user_id,
      'achievement',
      'New Achievement Unlocked!',
      'You earned: ' || (SELECT title FROM achievements WHERE id = v_achievement_id),
      '/achievements'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user_xp record when profile is created
CREATE OR REPLACE FUNCTION create_user_xp()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_xp (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_create_xp
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_xp();

-- Trigger for updated_at
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_xp_updated_at
  BEFORE UPDATE ON user_xp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some default achievements
INSERT INTO achievements (key, title, description, icon, category, requirement_type, requirement_value, reward_xp)
VALUES
  ('first_day', 'First Day', 'Complete your first day scroll-free', '🎯', 'streak', 'streak_days', 1, 50),
  ('7_days_strong', '7 Days Strong', 'Maintain a 7-day streak', '🏆', 'streak', 'streak_days', 7, 500),
  ('30_day_warrior', '30 Day Warrior', 'Reach a 30-day streak', '💎', 'streak', 'streak_days', 30, 1000),
  ('90_day_master', '90 Day Master', 'Achieve a 90-day streak', '👑', 'streak', 'streak_days', 90, 5000),
  ('first_build', 'First Build', 'Ship your first project', '🚀', 'build', 'projects_shipped', 1, 100),
  ('triple_shipper', 'Triple Shipper', 'Ship 3 projects', '🎯', 'build', 'projects_shipped', 3, 300),
  ('community_member', 'Community Member', 'Make your first post', '💬', 'social', 'posts_count', 1, 50),
  ('social_butterfly', 'Social Butterfly', 'Post 10 times', '🦋', 'social', 'posts_count', 10, 200)
ON CONFLICT (key) DO NOTHING;

-- Seed some default challenges
INSERT INTO challenges (title, description, category, requirement_type, requirement_value, reward_xp, active)
VALUES
  ('Ship Something Today', 'Build and deploy one thing', 'daily', 'projects_shipped', 1, 50, true),
  ('7-Day Focus Sprint', 'Complete 7 consecutive check-ins', 'weekly', 'check_ins', 7, 500, true),
  ('Community Builder', 'Post 10 times in community', 'monthly', 'posts_count', 10, 200, true),
  ('30-Day Streak Master', 'Maintain 30-day streak', 'special', 'streak_days', 30, 1000, false)
ON CONFLICT DO NOTHING;
