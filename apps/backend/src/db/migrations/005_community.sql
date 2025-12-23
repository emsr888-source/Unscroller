-- Community Features Migration
-- Posts, comments, likes, and community interactions

-- Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments Table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes Table (for posts)
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- Enable Row Level Security
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
CREATE POLICY posts_select ON community_posts
  FOR SELECT USING (true);  -- Anyone can view posts

CREATE POLICY posts_insert ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY posts_update ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY posts_delete ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY comments_select ON post_comments
  FOR SELECT USING (true);  -- Anyone can view comments

CREATE POLICY comments_insert ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY comments_update ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY comments_delete ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_likes
CREATE POLICY likes_select ON post_likes
  FOR SELECT USING (true);  -- Anyone can view likes

CREATE POLICY likes_insert ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY likes_delete ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to increment post likes count
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement post likes count
CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts
  SET likes_count = likes_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to increment comments count
CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement comments count
CREATE OR REPLACE FUNCTION decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts
  SET comments_count = comments_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for like counts
CREATE TRIGGER on_post_like_created
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_likes();

CREATE TRIGGER on_post_like_deleted
  AFTER DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_post_likes();

-- Triggers for comment counts
CREATE TRIGGER on_comment_created
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_comments();

CREATE TRIGGER on_comment_deleted
  AFTER DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION decrement_post_comments();

-- Trigger for updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
