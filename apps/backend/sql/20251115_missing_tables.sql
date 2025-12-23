-- Create application tables that were missing in Supabase
-- These definitions align with the NestJS + mobile features

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper constant for default tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.tenants WHERE id = '00000000-0000-0000-0000-000000000000'
  ) THEN
    INSERT INTO public.tenants (id, slug, name)
    VALUES ('00000000-0000-0000-0000-000000000000', 'default', 'Default Tenant')
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END;
$$;

-- =========================
-- Core user profile
-- =========================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  first_name TEXT,
  age INTEGER,
  gender TEXT,
  orientation TEXT,
  ethnicity TEXT,
  religion TEXT,
  region TEXT,
  show_religious_content BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  current_screen TEXT,
  completed_screens JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type TEXT,
  question_id TEXT,
  question_text TEXT,
  answer_value TEXT,
  answer_data JSONB,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.symptom_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms JSONB DEFAULT '[]'::jsonb,
  severity_score INTEGER,
  dependency_score INTEGER,
  average_score INTEGER,
  assessment_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  goals JSONB,
  goal_type TEXT,
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  icon TEXT,
  quit_date DATE,
  commitment_signature TEXT,
  commitment_signed_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referral_sources (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  source TEXT,
  referral_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT,
  goals JSONB DEFAULT '[]'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,
  daily_habits JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  quit_date DATE
);

CREATE TABLE IF NOT EXISTS public.onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screen_name TEXT,
  time_spent_seconds INTEGER,
  interactions JSONB DEFAULT '[]'::jsonb,
  dropped_off BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Achievements & gamification
-- =========================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  requirement_type TEXT,
  requirement_value INTEGER,
  reward_type TEXT,
  reward_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_earned_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  metric TEXT,
  target INTEGER,
  reward_type TEXT,
  reward_value TEXT,
  active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- =========================
-- Dashboard metrics
-- =========================
CREATE TABLE IF NOT EXISTS public.scroll_free_time (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  total_hours NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_in TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.creation_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  total_minutes NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Content: journal, todos, resources
-- =========================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  mood TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category TEXT,
  priority INTEGER,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_resource_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID,
  completed BOOLEAN DEFAULT FALSE,
  progress_percentage NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meditation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_type TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT,
  title TEXT,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Community / social tables
-- =========================
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  metadata JSONB,
  reported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT public.current_tenant_id() REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- =========================
-- Apply RLS for newly created tables
-- =========================
DO $tenant_rls$
DECLARE
  target_table TEXT;
  tables_with_rls TEXT[] := ARRAY[
    'user_profiles',
    'onboarding_progress',
    'quiz_responses',
    'symptom_assessments',
    'user_goals',
    'referral_sources',
    'app_ratings',
    'custom_plans',
    'onboarding_analytics',
    'achievements',
    'user_achievements',
    'user_xp',
    'challenges',
    'user_challenges',
    'scroll_free_time',
    'user_streaks',
    'creation_progress',
    'journal_entries',
    'todos',
    'user_resource_progress',
    'meditation_sessions',
    'calendar_events',
    'community_posts',
    'post_likes',
    'post_comments',
    'post_reports',
    'user_blocks'
  ];
BEGIN
  FOREACH target_table IN ARRAY tables_with_rls LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = target_table
    ) THEN
      RAISE NOTICE 'Skipping RLS for %, table not found', target_table;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', target_table);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON %I', target_table, target_table);
    EXECUTE format(
      'CREATE POLICY %I_tenant_isolation ON %I
        USING ((SELECT auth.role()) = ''service_role'' OR tenant_id = (SELECT public.current_tenant_id()))
        WITH CHECK ((SELECT auth.role()) = ''service_role'' OR tenant_id = (SELECT public.current_tenant_id()))',
      target_table,
      target_table
    );
  END LOOP;
END;
$tenant_rls$;

COMMIT;
