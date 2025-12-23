-- Social Features Migration
-- Friends, followers, and direct messages

-- Friendships/Following Table
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)  -- Can't follow yourself
);

-- Direct Messages Table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (sender_id != receiver_id)  -- Can't message yourself
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'achievement', 'social', 'reminder', 'community', 'milestone'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,  -- Deep link or screen to navigate to
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY follows_select ON user_follows
  FOR SELECT USING (true);  -- Anyone can see who follows who (public social graph)

CREATE POLICY follows_insert ON user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);  -- Can only follow as yourself

CREATE POLICY follows_delete ON user_follows
  FOR DELETE USING (auth.uid() = follower_id);  -- Can only unfollow as yourself

-- RLS Policies for direct_messages
CREATE POLICY messages_select ON direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);  -- Can only see your own messages

CREATE POLICY messages_insert ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);  -- Can only send as yourself

CREATE POLICY messages_update ON direct_messages
  FOR UPDATE USING (auth.uid() = receiver_id);  -- Only receiver can mark as read

CREATE POLICY messages_delete ON direct_messages
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);  -- Either party can delete

-- RLS Policies for notifications
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY notifications_delete ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Function to create notification on new follower
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, action_url)
  VALUES (
    NEW.following_id,
    'social',
    'New Follower',
    (SELECT full_name FROM public.profiles WHERE id = NEW.follower_id) || ' started following you',
    '/profile/' || NEW.follower_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification on new message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, action_url)
  VALUES (
    NEW.receiver_id,
    'social',
    'New Message',
    'You have a new message from ' || (SELECT full_name FROM public.profiles WHERE id = NEW.sender_id),
    '/messages/' || NEW.sender_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification on new comment
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id
  FROM community_posts
  WHERE id = NEW.post_id;
  
  -- Only notify if someone else commented
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, action_url)
    VALUES (
      post_owner_id,
      'community',
      'New Comment',
      (SELECT full_name FROM public.profiles WHERE id = NEW.user_id) || ' commented on your post',
      '/post/' || NEW.post_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification on post like
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id
  FROM community_posts
  WHERE id = NEW.post_id;
  
  -- Only notify if someone else liked
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, action_url)
    VALUES (
      post_owner_id,
      'community',
      'New Like',
      (SELECT full_name FROM public.profiles WHERE id = NEW.user_id) || ' liked your post',
      '/post/' || NEW.post_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for notifications
CREATE TRIGGER on_new_follower
  AFTER INSERT ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();

CREATE TRIGGER on_new_message
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

CREATE TRIGGER on_new_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_comment();

CREATE TRIGGER on_new_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_like();
