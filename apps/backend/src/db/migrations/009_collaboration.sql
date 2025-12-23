-- Collaboration + Community Extensions Migration
-- Partnership marketplace, build-in-public, and DM quality-of-life upgrades

-- PARTNERSHIP MARKETPLACE ---------------------------------------------------
CREATE TABLE IF NOT EXISTS partnership_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  project_summary TEXT NOT NULL,
  looking_for TEXT NOT NULL,
  why_you TEXT,
  contact_method TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  commitment TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  applications_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT partnership_posts_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS partnership_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  partnership_post_id UUID NOT NULL REFERENCES partnership_posts(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pitch TEXT NOT NULL,
  experience TEXT,
  contact_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partnership_post_id, applicant_id),
  CONSTRAINT partnership_applications_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS partnership_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  partnership_post_id UUID NOT NULL REFERENCES partnership_posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT partnership_reports_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_partnership_posts_creator ON partnership_posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_partnership_posts_status ON partnership_posts(status);
CREATE INDEX IF NOT EXISTS idx_partnership_applications_post ON partnership_applications(partnership_post_id);
CREATE INDEX IF NOT EXISTS idx_partnership_applications_applicant ON partnership_applications(applicant_id);

ALTER TABLE partnership_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY partnership_posts_select ON partnership_posts
  FOR SELECT USING (true);
CREATE POLICY partnership_posts_insert ON partnership_posts
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY partnership_posts_update ON partnership_posts
  FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY partnership_posts_delete ON partnership_posts
  FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY partnership_applications_select ON partnership_applications
  FOR SELECT USING (auth.uid() = applicant_id OR auth.uid() = (SELECT creator_id FROM partnership_posts WHERE id = partnership_post_id));
CREATE POLICY partnership_applications_insert ON partnership_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY partnership_applications_update ON partnership_applications
  FOR UPDATE USING (auth.uid() = (SELECT creator_id FROM partnership_posts WHERE id = partnership_post_id));
CREATE POLICY partnership_applications_delete ON partnership_applications
  FOR DELETE USING (auth.uid() = applicant_id);

CREATE POLICY partnership_reports_insert ON partnership_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY partnership_reports_select ON partnership_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE OR REPLACE FUNCTION update_partnership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_partnership_posts_touch
  BEFORE UPDATE ON partnership_posts
  FOR EACH ROW EXECUTE FUNCTION update_partnership_updated_at();

CREATE OR REPLACE FUNCTION inc_partnership_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE partnership_posts
    SET applications_count = applications_count + 1
    WHERE id = NEW.partnership_post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION dec_partnership_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE partnership_posts
    SET applications_count = GREATEST(applications_count - 1, 0)
    WHERE id = OLD.partnership_post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_partnership_application_insert
  AFTER INSERT ON partnership_applications
  FOR EACH ROW EXECUTE FUNCTION inc_partnership_applications_count();

CREATE TRIGGER trg_partnership_application_delete
  AFTER DELETE ON partnership_applications
  FOR EACH ROW EXECUTE FUNCTION dec_partnership_applications_count();


-- BUILD IN PUBLIC -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS build_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_tenant_id(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  goal TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  followers_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT build_projects_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

CREATE TABLE IF NOT EXISTS build_project_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_tenant_id(),
  project_id UUID NOT NULL REFERENCES build_projects(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, follower_id),
  CONSTRAINT build_project_followers_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

CREATE TABLE IF NOT EXISTS build_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_tenant_id(),
  project_id UUID NOT NULL REFERENCES build_projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  progress_percent NUMERIC,
  milestone TEXT,
  metrics JSONB,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT build_updates_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

CREATE TABLE IF NOT EXISTS build_update_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_tenant_id(),
  update_id UUID NOT NULL REFERENCES build_updates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (update_id, user_id),
  CONSTRAINT build_update_likes_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

CREATE TABLE IF NOT EXISTS build_update_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_tenant_id(),
  update_id UUID NOT NULL REFERENCES build_updates(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT build_update_comments_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

CREATE TABLE IF NOT EXISTS build_update_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_tenant_id(),
  update_id UUID NOT NULL REFERENCES build_updates(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT build_update_reports_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_build_projects_owner ON build_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_build_project_followers_project ON build_project_followers(project_id);
CREATE INDEX IF NOT EXISTS idx_build_project_followers_user ON build_project_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_build_updates_project ON build_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_build_updates_author ON build_updates(author_id);
CREATE INDEX IF NOT EXISTS idx_build_update_likes_update ON build_update_likes(update_id);
CREATE INDEX IF NOT EXISTS idx_build_update_likes_user ON build_update_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_build_update_comments_update ON build_update_comments(update_id);
CREATE INDEX IF NOT EXISTS idx_build_update_reports_update ON build_update_reports(update_id);

ALTER TABLE build_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_project_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_update_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_update_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_update_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY build_projects_select ON build_projects
  FOR SELECT USING (visibility = 'public' OR auth.uid() = owner_id);
CREATE POLICY build_projects_insert ON build_projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY build_projects_update ON build_projects
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY build_projects_delete ON build_projects
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY build_project_followers_select ON build_project_followers
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = (SELECT owner_id FROM build_projects WHERE id = project_id));
CREATE POLICY build_project_followers_insert ON build_project_followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY build_project_followers_delete ON build_project_followers
  FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY build_updates_select ON build_updates
  FOR SELECT USING (true);
CREATE POLICY build_updates_insert ON build_updates
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY build_updates_delete ON build_updates
  FOR DELETE USING (auth.uid() = author_id OR auth.uid() = (SELECT owner_id FROM build_projects WHERE id = project_id));

CREATE POLICY build_update_likes_select ON build_update_likes
  FOR SELECT USING (true);
CREATE POLICY build_update_likes_insert ON build_update_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY build_update_likes_delete ON build_update_likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY build_update_comments_select ON build_update_comments
  FOR SELECT USING (true);
CREATE POLICY build_update_comments_insert ON build_update_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY build_update_comments_delete ON build_update_comments
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY build_update_reports_insert ON build_update_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY build_update_reports_select ON build_update_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE OR REPLACE FUNCTION touch_build_project()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE build_projects SET updated_at = NOW() WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION inc_build_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE build_projects SET followers_count = followers_count + 1 WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION dec_build_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE build_projects SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.project_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION inc_build_update_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE build_updates SET likes_count = likes_count + 1 WHERE id = NEW.update_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION dec_build_update_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE build_updates SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.update_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION inc_build_update_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE build_updates SET comments_count = comments_count + 1 WHERE id = NEW.update_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION dec_build_update_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE build_updates SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.update_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_build_project_follow_insert
  AFTER INSERT ON build_project_followers
  FOR EACH ROW EXECUTE FUNCTION inc_build_followers_count();

CREATE TRIGGER trg_build_project_follow_delete
  AFTER DELETE ON build_project_followers
  FOR EACH ROW EXECUTE FUNCTION dec_build_followers_count();

CREATE TRIGGER trg_build_update_insert
  AFTER INSERT ON build_updates
  FOR EACH ROW EXECUTE FUNCTION touch_build_project();

CREATE TRIGGER trg_build_update_like_insert
  AFTER INSERT ON build_update_likes
  FOR EACH ROW EXECUTE FUNCTION inc_build_update_likes();

CREATE TRIGGER trg_build_update_like_delete
  AFTER DELETE ON build_update_likes
  FOR EACH ROW EXECUTE FUNCTION dec_build_update_likes();

CREATE TRIGGER trg_build_update_comment_insert
  AFTER INSERT ON build_update_comments
  FOR EACH ROW EXECUTE FUNCTION inc_build_update_comments();

CREATE TRIGGER trg_build_update_comment_delete
  AFTER DELETE ON build_update_comments
  FOR EACH ROW EXECUTE FUNCTION dec_build_update_comments();

CREATE TRIGGER trg_build_update_comment_touch
  AFTER INSERT OR DELETE ON build_update_comments
  FOR EACH ROW EXECUTE FUNCTION touch_build_project();

CREATE TRIGGER trg_build_update_like_touch
  AFTER INSERT OR DELETE ON build_update_likes
  FOR EACH ROW EXECUTE FUNCTION touch_build_project();


