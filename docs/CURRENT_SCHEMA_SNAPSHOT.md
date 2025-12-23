# Unscroller Database Schema Snapshot

> Generated: 2025-11-25
>
> Notes:
> - This file mirrors the live Supabase schema after the Collaboration Hub + habit widget updates.
> - It is for reference only. Apply changes via migrations rather than running this script directly.

```sql
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  title text NOT NULL,
  description text,
  requirement_type text,
  requirement_value integer,
  reward_type text,
  reward_value text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id),
  CONSTRAINT achievements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.app_ratings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  platform text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT app_ratings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT app_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT app_ratings_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.build_project_followers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  project_id uuid NOT NULL,
  follower_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT build_project_followers_pkey PRIMARY KEY (id),
  CONSTRAINT build_project_followers_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.build_projects(id),
  CONSTRAINT build_project_followers_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id),
  CONSTRAINT build_project_followers_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.build_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  goal text,
  tags ARRAY DEFAULT '{}'::text[],
  category text,
  visibility text NOT NULL DEFAULT 'public'::text CHECK (visibility = ANY (ARRAY['public'::text, 'private'::text])),
  followers_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT build_projects_pkey PRIMARY KEY (id),
  CONSTRAINT build_projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id),
  CONSTRAINT build_projects_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.build_update_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  update_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT build_update_comments_pkey PRIMARY KEY (id),
  CONSTRAINT build_update_comments_update_id_fkey FOREIGN KEY (update_id) REFERENCES public.build_updates(id),
  CONSTRAINT build_update_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id),
  CONSTRAINT build_update_comments_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.build_update_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  update_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT build_update_likes_pkey PRIMARY KEY (id),
  CONSTRAINT build_update_likes_update_id_fkey FOREIGN KEY (update_id) REFERENCES public.build_updates(id),
  CONSTRAINT build_update_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT build_update_likes_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.build_update_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  update_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT build_update_reports_pkey PRIMARY KEY (id),
  CONSTRAINT build_update_reports_update_id_fkey FOREIGN KEY (update_id) REFERENCES public.build_updates(id),
  CONSTRAINT build_update_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id),
  CONSTRAINT build_update_reports_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.build_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  project_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  progress_percent numeric,
  milestone text,
  metrics jsonb,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT build_updates_pkey PRIMARY KEY (id),
  CONSTRAINT build_updates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.build_projects(id),
  CONSTRAINT build_updates_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id),
  CONSTRAINT build_updates_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.calendar_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  event_date date NOT NULL,
  event_type text,
  title text,
  description text,
  icon text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT calendar_events_pkey PRIMARY KEY (id),
  CONSTRAINT calendar_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT calendar_events_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  title text NOT NULL,
  description text,
  metric text,
  target integer,
  reward_type text,
  reward_value text,
  active boolean DEFAULT true,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenges_pkey PRIMARY KEY (id),
  CONSTRAINT challenges_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT challenges_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.community_posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  media jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_posts_pkey PRIMARY KEY (id),
  CONSTRAINT community_posts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT community_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT community_posts_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.creation_progress (
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  total_minutes numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT creation_progress_pkey PRIMARY KEY (user_id),
  CONSTRAINT creation_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT creation_progress_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT creation_progress_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.custom_plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  plan_type text,
  goals jsonb DEFAULT '[]'::jsonb,
  benefits jsonb DEFAULT '[]'::jsonb,
  daily_habits jsonb DEFAULT '[]'::jsonb,
  milestones jsonb DEFAULT '[]'::jsonb,
  resources jsonb DEFAULT '[]'::jsonb,
  generated_at timestamp with time zone DEFAULT now(),
  quit_date date,
  CONSTRAINT custom_plans_pkey PRIMARY KEY (id),
  CONSTRAINT custom_plans_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT custom_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT custom_plans_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.entitlements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  feature character varying NOT NULL,
  expiresAt timestamp without time zone NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT entitlements_pkey PRIMARY KEY (id),
  CONSTRAINT FK_ce5285303a2e4073b2b745bb1e3 FOREIGN KEY (userId) REFERENCES public.users(id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid,
  eventType character varying NOT NULL,
  metadata jsonb,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT FK_9929fa8516afa13f87b41abb263 FOREIGN KEY (userId) REFERENCES public.users(id)
);
CREATE TABLE public.habit_definitions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  scope text NOT NULL CHECK (scope = ANY (ARRAY['daily'::text, 'weekly'::text])),
  icon text,
  color text,
  streak_target integer NOT NULL DEFAULT 21,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT habit_definitions_pkey PRIMARY KEY (id),
  CONSTRAINT habit_definitions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT habit_definitions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.habit_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  habit_id uuid NOT NULL,
  occurred_on date NOT NULL,
  todo_id uuid,
  was_completed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT habit_events_pkey PRIMARY KEY (id),
  CONSTRAINT habit_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT habit_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT habit_events_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habit_definitions(id),
  CONSTRAINT habit_events_todo_id_fkey FOREIGN KEY (todo_id) REFERENCES public.todos(id)
);
CREATE TABLE public.journal_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  entry_date date NOT NULL,
  mood text,
  content text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT journal_entries_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT journal_entries_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.meditation_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  exercise_type text,
  duration_minutes integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT meditation_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT meditation_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT meditation_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT meditation_sessions_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.onboarding_analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  screen_name text,
  time_spent_seconds integer,
  interactions jsonb DEFAULT '[]'::jsonb,
  dropped_off boolean DEFAULT false,
  completed boolean DEFAULT false,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT onboarding_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT onboarding_analytics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT onboarding_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT onboarding_analytics_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.onboarding_progress (
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  current_screen text,
  completed_screens jsonb DEFAULT '[]'::jsonb,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT onboarding_progress_pkey PRIMARY KEY (user_id),
  CONSTRAINT onboarding_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT onboarding_progress_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT onboarding_progress_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.partnership_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  partnership_post_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  pitch text NOT NULL,
  experience text,
  contact_method text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partnership_applications_pkey PRIMARY KEY (id),
  CONSTRAINT partnership_applications_partnership_post_id_fkey FOREIGN KEY (partnership_post_id) REFERENCES public.partnership_posts(id),
  CONSTRAINT partnership_applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES auth.users(id),
  CONSTRAINT partnership_applications_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.partnership_posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  headline text NOT NULL,
  project_summary text NOT NULL,
  looking_for text NOT NULL,
  why_you text,
  contact_method text NOT NULL,
  skills ARRAY DEFAULT '{}'::text[],
  commitment text,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'matched'::text, 'closed'::text])),
  applications_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partnership_posts_pkey PRIMARY KEY (id),
  CONSTRAINT partnership_posts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id),
  CONSTRAINT partnership_posts_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.partnership_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  partnership_post_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partnership_reports_pkey PRIMARY KEY (id),
  CONSTRAINT partnership_reports_partnership_post_id_fkey FOREIGN KEY (partnership_post_id) REFERENCES public.partnership_posts(id),
  CONSTRAINT partnership_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id),
  CONSTRAINT partnership_reports_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.post_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_comments_pkey PRIMARY KEY (id),
  CONSTRAINT post_comments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT post_comments_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.post_likes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  liked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_likes_pkey PRIMARY KEY (id),
  CONSTRAINT post_likes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT post_likes_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.post_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  post_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text,
  metadata jsonb,
  reported_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_reports_pkey PRIMARY KEY (id),
  CONSTRAINT post_reports_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT post_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT post_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id),
  CONSTRAINT post_reports_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.quiz_responses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  quiz_type text,
  question_id text,
  question_text text,
  answer_value text,
  answer_data jsonb,
  answered_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_responses_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_responses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT quiz_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT quiz_responses_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.referral_sources (
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  source text,
  referral_code text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_sources_pkey PRIMARY KEY (user_id),
  CONSTRAINT referral_sources_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT referral_sources_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT referral_sources_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.scroll_free_time (
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  total_hours numeric DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT scroll_free_time_pkey PRIMARY KEY (user_id),
  CONSTRAINT scroll_free_time_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT scroll_free_time_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT scroll_free_time_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  platform character varying NOT NULL,
  status character varying NOT NULL,
  externalId character varying,
  expiresAt timestamp without time zone NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT FK_fbdba4e2ac694cf8c9cecf4dc84 FOREIGN KEY (userId) REFERENCES public.users(id)
);
CREATE TABLE public.symptom_assessments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  symptoms jsonb DEFAULT '[]'::jsonb,
  severity_score integer,
  dependency_score integer,
  average_score integer,
  assessment_date timestamp with time zone DEFAULT now(),
  CONSTRAINT symptom_assessments_pkey PRIMARY KEY (id),
  CONSTRAINT symptom_assessments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT symptom_assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT symptom_assessments_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  slug USER-DEFINED NOT NULL UNIQUE,
  name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tenants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.todos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  text text NOT NULL,
  category text,
  priority integer,
  due_date date,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  scope text DEFAULT 'daily'::text CHECK (scope = ANY (ARRAY['daily'::text, 'weekly'::text])),
  is_habit boolean DEFAULT false,
  habit_id uuid,
  habit_occurred_on date,
  CONSTRAINT todos_pkey PRIMARY KEY (id),
  CONSTRAINT todos_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT todos_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT todos_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habit_definitions(id)
);
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.user_blocks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  blocked_user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT user_blocks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT user_blocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_blocks_blocked_user_id_fkey FOREIGN KEY (blocked_user_id) REFERENCES auth.users(id),
  CONSTRAINT user_blocks_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.user_challenges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_challenges_pkey PRIMARY KEY (id),
  CONSTRAINT user_challenges_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT user_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_challenges_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id),
  CONSTRAINT user_challenges_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.user_goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  title text,
  description text,
  goals jsonb,
  goal_type text,
  target_value integer,
  current_value integer DEFAULT 0,
  icon text,
  quit_date date,
  commitment_signature text,
  commitment_signed_at timestamp with time zone,
  active boolean DEFAULT true,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_goals_pkey PRIMARY KEY (id),
  CONSTRAINT user_goals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT user_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_goals_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.user_profiles (
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  first_name text,
  age integer,
  gender text,
  orientation text,
  ethnicity text,
  religion text,
  region text,
  show_religious_content boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  total_xp integer DEFAULT 0,
  current_level integer DEFAULT 1,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT user_profiles_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.user_resource_progress (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  user_id uuid NOT NULL,
  resource_id uuid,
  completed boolean DEFAULT false,
  progress_percentage numeric,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_resource_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_resource_progress_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT user_resource_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_resource_progress_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.user_streaks (
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_check_in timestamp with time zone,
  CONSTRAINT user_streaks_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_streaks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT user_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_streaks_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.user_xp (
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  total_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  last_earned_at timestamp with time zone,
  CONSTRAINT user_xp_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_xp_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_xp_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  supabaseId character varying NOT NULL UNIQUE,
  email character varying NOT NULL,
  stripeCustomerId character varying,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
```
