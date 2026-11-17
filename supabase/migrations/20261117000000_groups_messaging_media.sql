-- =============================================================================
-- TRACEWISE MIGRATION: GROUPS, ADMIN ROLES, DIRECT MESSAGING & MEDIA ATTACHMENTS
-- Migration: 20261117000000_groups_messaging_media.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTEND COMMUNITY GROUPS TABLE
-- -----------------------------------------------------------------------------
ALTER TABLE public.community_groups
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_groups_visibility_check'
  ) THEN
    ALTER TABLE public.community_groups
      ADD CONSTRAINT community_groups_visibility_check CHECK (visibility IN ('public', 'private'));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. EXTEND COMMUNITY GROUP MEMBERS TABLE (Owner, Admin, Moderator, Member)
-- -----------------------------------------------------------------------------
ALTER TABLE public.community_group_members
  DROP CONSTRAINT IF EXISTS community_group_members_role_check;

ALTER TABLE public.community_group_members
  ADD CONSTRAINT community_group_members_role_check
  CHECK (role IN ('owner', 'admin', 'moderator', 'member'));

-- -----------------------------------------------------------------------------
-- 3. GROUP MEMBERSHIP JOIN REQUESTS (Private Groups)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  user_name TEXT,
  user_handle TEXT,
  user_avatar TEXT,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_join_requests_group ON public.community_group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_user ON public.community_group_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_status ON public.community_group_join_requests(status);

-- -----------------------------------------------------------------------------
-- 4. ATTACHMENTS ON POSTS AND GROUP POSTS
-- -----------------------------------------------------------------------------
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.community_comments
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.community_group_posts
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- -----------------------------------------------------------------------------
-- 5. GROUP COMMENTS / DISCUSSION REPLIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_group_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_group_posts(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_comments_post_id ON public.community_group_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_group_comments_group_id ON public.community_group_comments(group_id);

-- -----------------------------------------------------------------------------
-- 6. DIRECT MESSAGING CONVERSATIONS & PARTICIPANTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  last_message_text TEXT DEFAULT '',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_handle TEXT,
  user_name TEXT,
  user_avatar TEXT,
  unread_count INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);

-- -----------------------------------------------------------------------------
-- 7. MESSAGES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_handle TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  delivery_status TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- -----------------------------------------------------------------------------
-- 8. USER BLOCKS & REPORTING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- -----------------------------------------------------------------------------
-- 9. HELPER FUNCTIONS FOR SECURITY & PERMISSIONS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_group_owner(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'owner'
  ) OR EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = p_group_id AND creator_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role IN ('owner', 'admin')
  ) OR EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = p_group_id AND creator_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_moderate_group(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role IN ('owner', 'admin', 'moderator')
  ) OR EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = p_group_id AND creator_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_conv_participant(p_conv_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conv_id AND user_id = p_user_id
  );
$$;

-- -----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.community_group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS: community_group_join_requests
CREATE POLICY "Users can read own join requests or group admins can read"
  ON public.community_group_join_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_group_admin(group_id, auth.uid())
  );

CREATE POLICY "Users can create their own join requests"
  ON public.community_group_join_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group admins can update join requests"
  ON public.community_group_join_requests FOR UPDATE
  TO authenticated
  USING (public.is_group_admin(group_id, auth.uid()))
  WITH CHECK (public.is_group_admin(group_id, auth.uid()));

CREATE POLICY "Users or group admins can delete join requests"
  ON public.community_group_join_requests FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_group_admin(group_id, auth.uid())
  );

-- RLS: community_group_comments
CREATE POLICY "Public read group comments for public groups or members for private"
  ON public.community_group_comments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.community_groups WHERE id = group_id AND visibility = 'public')
    OR public.is_group_member(group_id, auth.uid())
  );

CREATE POLICY "Members can insert group comments"
  ON public.community_group_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND public.is_group_member(group_id, auth.uid())
  );

CREATE POLICY "Author or moderator can delete group comments"
  ON public.community_group_comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id OR public.can_moderate_group(group_id, auth.uid())
  );

-- RLS: conversations
CREATE POLICY "Participants can view their conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    public.is_conv_participant(id, auth.uid())
  );

CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (public.is_conv_participant(id, auth.uid()))
  WITH CHECK (public.is_conv_participant(id, auth.uid()));

-- RLS: conversation_participants
CREATE POLICY "Participants can view members of their conversations"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (
    public.is_conv_participant(conversation_id, auth.uid())
  );

CREATE POLICY "Authenticated users can add participants when creating conversation"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Participants can update their own participant record"
  ON public.conversation_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS: messages
CREATE POLICY "Participants can view conversation messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    public.is_conv_participant(conversation_id, auth.uid())
  );

CREATE POLICY "Participants can send messages if conversation is active or request pending"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND public.is_conv_participant(conversation_id, auth.uid())
  );

CREATE POLICY "Sender or recipient can update delivery status"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (public.is_conv_participant(conversation_id, auth.uid()))
  WITH CHECK (public.is_conv_participant(conversation_id, auth.uid()));

-- RLS: user_blocks
CREATE POLICY "Users can read own blocks"
  ON public.user_blocks FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block other users"
  ON public.user_blocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id AND auth.uid() <> blocked_id);

CREATE POLICY "Users can unblock users"
  ON public.user_blocks FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- -----------------------------------------------------------------------------
-- 11. GRANT ACCESS TO ROLES
-- -----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_group_join_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_group_comments TO authenticated;
GRANT SELECT ON public.community_group_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_blocks TO authenticated;
