-- Onboarding Schema
-- This migration creates tables for storing all onboarding flow data

-- =====================================================
-- USER ONBOARDING PROGRESS
-- =====================================================
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_screen VARCHAR(100),
  completed_screens JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- QUIZ RESPONSES
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type VARCHAR(50) NOT NULL, -- 'demographic', 'symptoms', 'goals', etc.
  question_id VARCHAR(100) NOT NULL,
  question_text TEXT,
  answer_value TEXT,
  answer_data JSONB, -- For multi-select or complex answers
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quiz_responses_user_id ON quiz_responses(user_id);
CREATE INDEX idx_quiz_responses_quiz_type ON quiz_responses(quiz_type);

-- =====================================================
-- USER PROFILE DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  age INTEGER,
  gender VARCHAR(50),
  orientation VARCHAR(50),
  ethnicity VARCHAR(100),
  religion VARCHAR(100),
  region VARCHAR(100),
  show_religious_content BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- SYMPTOMS & IMPACT ASSESSMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS symptom_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms JSONB DEFAULT '[]'::jsonb, -- Array of selected symptoms
  severity_score INTEGER, -- 0-100
  dependency_score INTEGER, -- Calculated score (e.g., 64%)
  average_score INTEGER, -- Comparison score (e.g., 40%)
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, assessment_date)
);

-- =====================================================
-- GOALS & MOTIVATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goals JSONB DEFAULT '[]'::jsonb, -- Array of selected goals
  quit_date DATE,
  commitment_signature TEXT, -- Base64 encoded signature image
  commitment_signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- REFERRAL SOURCES
-- =====================================================
CREATE TABLE IF NOT EXISTS referral_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source VARCHAR(100), -- 'google', 'tv', 'instagram', 'tiktok', 'facebook', 'x', 'friend', etc.
  referral_code VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- APP RATINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS app_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  rated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  platform VARCHAR(50), -- 'ios', 'android'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_app_ratings_user_id ON app_ratings(user_id);
CREATE INDEX idx_app_ratings_rating ON app_ratings(rating);

-- =====================================================
-- CUSTOM PLANS
-- =====================================================
CREATE TABLE IF NOT EXISTS custom_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
  quit_date DATE,
  benefits JSONB DEFAULT '[]'::jsonb, -- Array of benefit IDs
  daily_habits JSONB DEFAULT '[]'::jsonb, -- Array of recommended habits
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- SUBSCRIPTION EVENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'viewed_paywall', 'viewed_offer', 'claimed_offer', 'purchased', 'cancelled'
  plan_type VARCHAR(50), -- 'annual', 'monthly'
  plan_price_cents INTEGER,
  discount_percentage INTEGER,
  offer_type VARCHAR(100), -- 'one_time_80', 'standard', etc.
  payment_platform VARCHAR(50), -- 'stripe', 'apple', 'google'
  transaction_id VARCHAR(255),
  event_metadata JSONB, -- Additional event data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at);

-- =====================================================
-- ONBOARDING ANALYTICS
-- =====================================================
CREATE TABLE IF NOT EXISTS onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screen_name VARCHAR(100) NOT NULL,
  time_spent_seconds INTEGER,
  interactions JSONB DEFAULT '[]'::jsonb, -- Array of interaction events
  dropped_off BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_onboarding_analytics_user_id ON onboarding_analytics(user_id);
CREATE INDEX idx_onboarding_analytics_screen ON onboarding_analytics(screen_name);
CREATE INDEX idx_onboarding_analytics_dropped_off ON onboarding_analytics(dropped_off);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for onboarding_progress
CREATE POLICY "Users can view their own onboarding progress"
  ON onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
  ON onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
  ON onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for quiz_responses
CREATE POLICY "Users can view their own quiz responses"
  ON quiz_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz responses"
  ON quiz_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for symptom_assessments
CREATE POLICY "Users can view their own symptom assessments"
  ON symptom_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own symptom assessments"
  ON symptom_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_goals
CREATE POLICY "Users can view their own goals"
  ON user_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON user_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for referral_sources
CREATE POLICY "Users can view their own referral source"
  ON referral_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral source"
  ON referral_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for app_ratings
CREATE POLICY "Users can view their own ratings"
  ON app_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings"
  ON app_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for custom_plans
CREATE POLICY "Users can view their own custom plan"
  ON custom_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom plan"
  ON custom_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom plan"
  ON custom_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for subscription_events
CREATE POLICY "Users can view their own subscription events"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription events"
  ON subscription_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for onboarding_analytics
CREATE POLICY "Users can view their own analytics"
  ON onboarding_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON onboarding_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_onboarding_progress_updated_at BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_plans_updated_at BEFORE UPDATE ON custom_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate dependency score
CREATE OR REPLACE FUNCTION calculate_dependency_score(symptoms_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  symptom_count INTEGER;
BEGIN
  symptom_count := jsonb_array_length(symptoms_data);
  
  -- Simple scoring: each symptom adds points
  -- This is a placeholder - replace with actual scoring algorithm
  score := LEAST(100, symptom_count * 15);
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_completed ON onboarding_progress(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_user_id ON symptom_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_sources_user_id ON referral_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_plans_user_id ON custom_plans(user_id);
