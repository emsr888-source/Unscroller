BEGIN;

DO $$
DECLARE
  idx TEXT;
BEGIN
  FOREACH idx IN ARRAY ARRAY[
    'app_ratings_tenant_idx',
    'calendar_events_tenant_idx',
    'challenges_tenant_idx',
    'community_posts_tenant_idx',
    'creation_progress_tenant_idx',
    'custom_plans_tenant_idx',
    'journal_entries_tenant_idx',
    'meditation_sessions_tenant_idx',
    'onboarding_analytics_tenant_idx',
    'onboarding_progress_tenant_idx',
    'post_comments_tenant_idx',
    'post_likes_tenant_idx',
    'post_reports_tenant_idx',
    'quiz_responses_tenant_idx',
    'referral_sources_tenant_idx',
    'scroll_free_time_tenant_idx',
    'symptom_assessments_tenant_idx',
    'todos_tenant_idx',
    'user_blocks_tenant_idx',
    'user_challenges_tenant_idx',
    'user_goals_tenant_idx',
    'user_profiles_tenant_idx',
    'user_resource_progress_tenant_idx',
    'user_streaks_tenant_idx'
  ] LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = idx
    ) THEN
      EXECUTE format('DROP INDEX IF EXISTS public.%I', idx);
    ELSE
      RAISE NOTICE 'Skipping %, index not found', idx;
    END IF;
  END LOOP;
END;
$$;

COMMIT;
