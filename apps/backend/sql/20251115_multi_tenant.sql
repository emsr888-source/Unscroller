-- Multi-tenant bootstrap migration
-- Applies tenant scaffolding, tenant_id columns, and RLS policies

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug CITEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.tenants (id, slug, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'default', 'Default Tenant')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

CREATE OR REPLACE FUNCTION public.touch_tenants_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_updated_at ON public.tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.touch_tenants_updated_at();

-- Helper function to expose the current tenant id derived from the authenticated user
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
STABLE
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant uuid;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  SELECT tenant_id INTO v_tenant
  FROM public.user_profiles
  WHERE id = auth.uid();

  RETURN v_tenant;
END;
$$;

-- Utility to add tenant columns safely
CREATE OR REPLACE PROCEDURE public._ensure_tenant_column(target_table text)
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = target_table
  ) THEN
    RAISE NOTICE 'Skipping tenant column for %, table not found', target_table;
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID', target_table);
  EXECUTE format(
    'UPDATE %I SET tenant_id = COALESCE(tenant_id, ''00000000-0000-0000-0000-000000000000''::uuid)',
    target_table
  );
  EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL', target_table);
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = format('public.%I', target_table)::regclass
      AND conname = format('%I_tenant_fk', target_table)
  ) THEN
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)',
      target_table,
      target_table
    );
  END IF;
  -- Clean up legacy tenant index names if present to avoid duplicates
  EXECUTE format('DROP INDEX IF EXISTS public.%I_tenant_idx', target_table);

  EXECUTE format('CREATE INDEX IF NOT EXISTS %I_tenant_id_idx ON %I(tenant_id)', target_table, target_table);
END;
$$;

-- Apply tenant column additions (user-centric tables)
CALL public._ensure_tenant_column('user_profiles');
CALL public._ensure_tenant_column('user_daily_stats');
CALL public._ensure_tenant_column('user_challenges');
CALL public._ensure_tenant_column('leaderboard_entries');
CALL public._ensure_tenant_column('constellations');
CALL public._ensure_tenant_column('stars');
CALL public._ensure_tenant_column('sky_states');
CALL public._ensure_tenant_column('buddy_pairs');
CALL public._ensure_tenant_column('buddy_requests');
CALL public._ensure_tenant_column('buddy_activities');
CALL public._ensure_tenant_column('notification_settings');
CALL public._ensure_tenant_column('notification_logs');
CALL public._ensure_tenant_column('ai_conversations');
CALL public._ensure_tenant_column('ai_messages');
CALL public._ensure_tenant_column('email_logs');
CALL public._ensure_tenant_column('onboarding_progress');
CALL public._ensure_tenant_column('quiz_responses');
CALL public._ensure_tenant_column('symptom_assessments');
CALL public._ensure_tenant_column('user_goals');
CALL public._ensure_tenant_column('subscription_events');
CALL public._ensure_tenant_column('referral_sources');
CALL public._ensure_tenant_column('app_ratings');
CALL public._ensure_tenant_column('custom_plans');
CALL public._ensure_tenant_column('onboarding_analytics');
CALL public._ensure_tenant_column('community_posts');
CALL public._ensure_tenant_column('post_likes');
CALL public._ensure_tenant_column('post_comments');
CALL public._ensure_tenant_column('post_reports');
CALL public._ensure_tenant_column('user_blocks');
CALL public._ensure_tenant_column('journal_entries');
CALL public._ensure_tenant_column('todos');
CALL public._ensure_tenant_column('user_resource_progress');
CALL public._ensure_tenant_column('meditation_sessions');
CALL public._ensure_tenant_column('calendar_events');
CALL public._ensure_tenant_column('scroll_free_time');
CALL public._ensure_tenant_column('user_streaks');
CALL public._ensure_tenant_column('creation_progress');

-- Challenges table can remain global but scoped by tenant when desired
CALL public._ensure_tenant_column('challenges');

-- Drop helper once complete
DROP PROCEDURE IF EXISTS public._ensure_tenant_column;

-- RLS Policies
DO $tenant_rls$
DECLARE
  target_table text;
  tables_with_rls text[] := array[
    'user_profiles',
    'user_daily_stats',
    'user_challenges',
    'leaderboard_entries',
    'constellations',
    'stars',
    'sky_states',
    'buddy_pairs',
    'buddy_requests',
    'buddy_activities',
    'notification_settings',
    'notification_logs',
    'ai_conversations',
    'ai_messages',
    'email_logs',
    'onboarding_progress',
    'quiz_responses',
    'symptom_assessments',
    'user_goals',
    'subscription_events',
    'referral_sources',
    'app_ratings',
    'custom_plans',
    'onboarding_analytics',
    'community_posts',
    'post_likes',
    'post_comments',
    'post_reports',
    'user_blocks',
    'journal_entries',
    'todos',
    'user_resource_progress',
    'meditation_sessions',
    'calendar_events',
    'scroll_free_time',
    'user_streaks',
    'creation_progress',
    'challenges'
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
