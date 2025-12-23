BEGIN;

DO $$
DECLARE
  target_table TEXT;
  tables_with_rls TEXT[] := ARRAY[
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
  ];
BEGIN
  FOREACH target_table IN ARRAY tables_with_rls LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = target_table
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', target_table);
      EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON %I', target_table, target_table);
      EXECUTE format(
        'CREATE POLICY %I_tenant_isolation ON %I
          USING (auth.role() = ''service_role'' OR tenant_id = (SELECT public.current_tenant_id()))
          WITH CHECK (auth.role() = ''service_role'' OR tenant_id = (SELECT public.current_tenant_id()))',
        target_table,
        target_table
      );
    ELSE
      RAISE NOTICE 'Skipping RLS refresh for %, table not found', target_table;
    END IF;
  END LOOP;
END;
$$;

COMMIT;
