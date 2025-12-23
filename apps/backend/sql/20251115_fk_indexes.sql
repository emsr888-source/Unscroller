BEGIN;

-- Ensure every tenant-aware table has an index to support tenant_id foreign keys
DO $$
DECLARE
  tenant_table TEXT;
BEGIN
  FOREACH tenant_table IN ARRAY ARRAY[
    'achievements',
    'app_ratings',
    'calendar_events',
    'challenges',
    'community_posts',
    'creation_progress',
    'custom_plans',
    'journal_entries',
    'meditation_sessions',
    'onboarding_analytics',
    'onboarding_progress',
    'post_comments',
    'post_likes',
    'post_reports',
    'quiz_responses',
    'referral_sources',
    'scroll_free_time',
    'symptom_assessments',
    'todos',
    'user_achievements',
    'user_blocks',
    'user_challenges',
    'user_goals',
    'user_profiles',
    'user_resource_progress',
    'user_streaks',
    'user_xp'
  ] LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tenant_table
        AND column_name = 'tenant_id'
    ) THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (tenant_id)',
        tenant_table || '_tenant_id_idx',
        tenant_table
      );
    ELSE
      RAISE NOTICE 'Skipping tenant_id index for %, column not found', tenant_table;
    END IF;
  END LOOP;
END;
$$;

-- Ensure remaining foreign keys have supporting indexes
DO $$
DECLARE
  rec RECORD;
  index_name TEXT;
BEGIN
  FOR rec IN
    SELECT *
    FROM (
      VALUES
        ('app_ratings', 'user_id'),
        ('calendar_events', 'user_id'),
        ('community_posts', 'user_id'),
        ('custom_plans', 'user_id'),
        ('entitlements', 'userId'),
        ('events', 'userId'),
        ('meditation_sessions', 'user_id'),
        ('onboarding_analytics', 'user_id'),
        ('post_comments', 'post_id'),
        ('post_comments', 'user_id'),
        ('post_likes', 'user_id'),
        ('post_reports', 'post_id'),
        ('post_reports', 'reporter_id'),
        ('post_reports', 'user_id'),
        ('quiz_responses', 'user_id'),
        ('symptom_assessments', 'user_id'),
        ('todos', 'user_id'),
        ('user_achievements', 'achievement_id'),
        ('user_blocks', 'blocked_user_id'),
        ('user_blocks', 'user_id'),
        ('user_challenges', 'challenge_id'),
        ('user_goals', 'user_id'),
        ('user_resource_progress', 'user_id'),
        ('subscriptions', 'userId')
    ) AS t(table_name, column_name)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = rec.table_name
        AND column_name = rec.column_name
    ) THEN
      index_name := format('%s_%s_idx', rec.table_name, lower(rec.column_name));
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)',
        index_name,
        rec.table_name,
        rec.column_name
      );
    ELSE
      RAISE NOTICE 'Skipping index for %.%, column not found', rec.table_name, rec.column_name;
    END IF;
  END LOOP;
END;
$$;

COMMIT;
