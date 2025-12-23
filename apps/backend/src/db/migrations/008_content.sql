-- Content Features Migration
-- Journal entries, resources, todos, and meditation sessions

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  mood TEXT,  -- emoji representing mood
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Todos/Tasks
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'build',  -- 'build', 'focus', 'health'
  priority INTEGER DEFAULT 1,  -- 1=high, 2=medium, 3=low
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources (Educational Content)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- 'article', 'video', 'tool'
  content_type TEXT,  -- 'dopamine_science', 'building_in_public', 'deep_work', etc.
  url TEXT,
  thumbnail_url TEXT,
  duration TEXT,  -- e.g., '5 min read', '15 min video'
  author TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Resource Progress
CREATE TABLE IF NOT EXISTS user_resource_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- Meditation/Exercise Sessions
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,  -- '5_min_breathing', 'body_scan', 'gratitude', 'visualization'
  duration_minutes INTEGER NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar Events (for marking special days)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,  -- 'milestone', 'achievement', 'custom'
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,  -- emoji
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_featured ON resources(featured);
CREATE INDEX IF NOT EXISTS idx_user_resource_progress_user_id ON user_resource_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_created ON meditation_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);

-- Enable Row Level Security
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resource_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journal_entries
CREATE POLICY journal_select ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY journal_insert ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY journal_update ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY journal_delete ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for todos
CREATE POLICY todos_select ON todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY todos_insert ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY todos_update ON todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY todos_delete ON todos
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for resources (public read)
CREATE POLICY resources_select ON resources
  FOR SELECT USING (active = true);

-- RLS Policies for user_resource_progress
CREATE POLICY resource_progress_select ON user_resource_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY resource_progress_insert ON user_resource_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY resource_progress_update ON user_resource_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for meditation_sessions
CREATE POLICY meditation_select ON meditation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY meditation_insert ON meditation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for calendar_events
CREATE POLICY calendar_events_select ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY calendar_events_insert ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY calendar_events_update ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY calendar_events_delete ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some default resources
INSERT INTO resources (title, description, category, content_type, duration, featured, active)
VALUES
  ('The Science of Dopamine', 'Understanding how social media affects your brain and what you can do about it', 'article', 'dopamine_science', '5 min read', true, true),
  ('Building in Public', 'Why sharing your journey leads to better outcomes and faster growth', 'article', 'building_in_public', '7 min read', true, true),
  ('Deep Work Explained', 'Master the art of focused work and eliminate distractions', 'video', 'deep_work', '10 min video', true, true),
  ('Creator Mindset Masterclass', 'Transform from consumer to creator with this complete guide', 'video', 'creator_mindset', '15 min video', true, true),
  ('Focus Timer', 'Pomodoro-style timer for deep work sessions', 'tool', 'productivity', 'Tool', false, true),
  ('Habit Tracker', 'Track your daily habits and build consistency', 'tool', 'productivity', 'Tool', false, true)
ON CONFLICT DO NOTHING;
