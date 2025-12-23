-- Core Authentication & Users Migration
-- Sets up Supabase Auth integration and user profiles
-- This should be run FIRST before all other migrations

-- Note: Supabase automatically creates auth.users table
-- We create a public.profiles table that references it

-- User Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  current_project TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User preferences
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  
  -- Stats (denormalized for quick access)
  total_days INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  projects_shipped INTEGER DEFAULT 0,
  community_posts INTEGER DEFAULT 0,
  
  -- Onboarding state
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step TEXT,
  
  -- Subscription info (from RevenueCat)
  subscription_status TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (SECURE MULTI-TENANT)
-- Users can view their own profile
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can view other profiles (for social features)
CREATE POLICY profiles_select_others ON public.profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can delete only their own profile
CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Add foreign key constraints to existing tables (run after this migration)
-- ALTER TABLE user_streaks ADD CONSTRAINT fk_user_streaks_user 
--   FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
-- 
-- ALTER TABLE scroll_free_time ADD CONSTRAINT fk_scroll_free_time_user 
--   FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
-- 
-- ALTER TABLE creation_progress ADD CONSTRAINT fk_creation_progress_user 
--   FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
-- 
-- ALTER TABLE daily_check_ins ADD CONSTRAINT fk_daily_check_ins_user 
--   FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
