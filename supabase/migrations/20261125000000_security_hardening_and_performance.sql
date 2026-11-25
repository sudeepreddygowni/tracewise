-- =============================================================================
-- TRACEWISE DATABASE SECURITY HARDENING, RLS PERFORMANCE & PRODUCT ANALYTICS
-- Migration: 20261125000000_security_hardening_and_performance.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. INTERNAL SCHEMA FOR RLS HELPERS (PREVENTS EXPOSURE ON /rest/v1/rpc/)
-- -----------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS internal;

-- Internal policy helpers (avoids infinite RLS recursion & avoids PostgREST exposure)
CREATE OR REPLACE FUNCTION internal.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = p_group_id AND creator_id = p_user_id
  );
$function$;

CREATE OR REPLACE FUNCTION internal.is_group_admin(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role IN ('owner', 'admin')
  ) OR EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = p_group_id AND creator_id = p_user_id
  );
$function$;

CREATE OR REPLACE FUNCTION internal.can_moderate_group(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role IN ('owner', 'admin', 'moderator')
  ) OR EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = p_group_id AND creator_id = p_user_id
  );
$function$;

CREATE OR REPLACE FUNCTION internal.is_conv_participant(p_conv_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conv_id AND user_id = p_user_id
  );
$function$;

CREATE OR REPLACE FUNCTION internal.is_group_owner(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'owner'
  ) OR EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = p_group_id AND creator_id = p_user_id
  );
$function$;

GRANT USAGE ON SCHEMA internal TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA internal TO authenticated, service_role;

-- Drop obsolete public helper functions now safely moved to internal schema
DROP FUNCTION IF EXISTS public.can_moderate_group(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_conv_participant(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_group_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_group_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_group_owner(uuid, uuid);

-- -----------------------------------------------------------------------------
-- 2. HARDEN COMMUNITY GROUP MEMBERSHIP AUTHORIZATION & CONSOLIDATE POLICIES
-- -----------------------------------------------------------------------------

-- Drop previous unconstrained membership policies
DROP POLICY IF EXISTS "Authenticated users can join groups" ON public.community_group_members;
DROP POLICY IF EXISTS "Group admins can delete group members" ON public.community_group_members;
DROP POLICY IF EXISTS "Users can leave group or creator can remove" ON public.community_group_members;
DROP POLICY IF EXISTS "Public read group members" ON public.community_group_members;

-- Secure INSERT: Users can only join public groups with role 'member', or creator as 'owner'
CREATE POLICY "Authenticated users can join public groups as members"
ON public.community_group_members
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = (SELECT auth.uid()))
  AND (
    (role = 'owner' AND EXISTS (
      SELECT 1 FROM public.community_groups
      WHERE id = community_group_members.group_id
        AND creator_id = (SELECT auth.uid())
    ))
    OR
    (role = 'member' AND EXISTS (
      SELECT 1 FROM public.community_groups
      WHERE id = community_group_members.group_id
        AND visibility = 'public'
    ))
  )
);

-- Consolidated DELETE: User can leave, or group admin can remove
CREATE POLICY "Users can leave or group admins remove members"
ON public.community_group_members
FOR DELETE
TO authenticated
USING (
  (user_id = (SELECT auth.uid()))
  OR internal.is_group_admin(group_id, (SELECT auth.uid()))
);

-- Selective SELECT: Public groups' members are public; private groups only readable by members/admins
CREATE POLICY "Read group members for public groups or members"
ON public.community_group_members
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = community_group_members.group_id
      AND visibility = 'public'
  )
  OR internal.is_group_member(group_id, (SELECT auth.uid()))
);

-- -----------------------------------------------------------------------------
-- 3. CONSOLIDATE COMMUNITY GROUP COMMENTS INSERT POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can insert group comments" ON public.community_group_comments;
DROP POLICY IF EXISTS "Members or public group users can insert group comments" ON public.community_group_comments;
DROP POLICY IF EXISTS "Author or moderator can delete group comments" ON public.community_group_comments;
DROP POLICY IF EXISTS "Public read group comments for public groups or members for pri" ON public.community_group_comments;

CREATE POLICY "Members or public group users can insert group comments"
ON public.community_group_comments
FOR INSERT
TO authenticated
WITH CHECK (
  (author_id = (SELECT auth.uid()))
  AND (
    internal.is_group_member(group_id, (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.community_groups
      WHERE id = community_group_comments.group_id
        AND visibility = 'public'
    )
  )
);

CREATE POLICY "Author or moderator can delete group comments"
ON public.community_group_comments
FOR DELETE
TO authenticated
USING (
  (author_id = (SELECT auth.uid()))
  OR internal.can_moderate_group(group_id, (SELECT auth.uid()))
);

CREATE POLICY "Read group comments for public groups or members"
ON public.community_group_comments
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = community_group_comments.group_id
      AND visibility = 'public'
  )
  OR internal.is_group_member(group_id, (SELECT auth.uid()))
);

-- -----------------------------------------------------------------------------
-- 4. HARDEN MESSAGES & CONVERSATION PARTICIPANTS
-- -----------------------------------------------------------------------------

-- Enforce field-level protection on messages via trigger
CREATE OR REPLACE FUNCTION public.enforce_message_update_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Immutable identity fields
  IF NEW.id <> OLD.id OR NEW.conversation_id <> OLD.conversation_id OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify message ID, conversation_id, or created_at timestamp';
  END IF;

  -- Sender cannot be changed
  IF NEW.sender_id <> OLD.sender_id THEN
    RAISE EXCEPTION 'Cannot alter message sender identity';
  END IF;

  -- If non-sender updates message, they can ONLY update delivery status or read receipt
  IF OLD.sender_id <> (SELECT auth.uid()) THEN
    IF (NEW.content IS DISTINCT FROM OLD.content)
       OR (NEW.encrypted_content IS DISTINCT FROM OLD.encrypted_content)
       OR (NEW.media_url IS DISTINCT FROM OLD.media_url) THEN
      RAISE EXCEPTION 'Only the original message sender can update message content';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_update_restrictions ON public.messages;
CREATE TRIGGER trg_messages_update_restrictions
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_message_update_restrictions();

-- Enforce participant identity protection via trigger
CREATE OR REPLACE FUNCTION public.enforce_participant_update_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.conversation_id <> OLD.conversation_id OR NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Cannot alter conversation_id or user_id on participant record';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_participant_update_restrictions ON public.conversation_participants;
CREATE TRIGGER trg_participant_update_restrictions
BEFORE UPDATE ON public.conversation_participants
FOR EACH ROW
EXECUTE FUNCTION public.enforce_participant_update_restrictions();

-- Harden conversation_participants policies with (SELECT auth.uid())
DROP POLICY IF EXISTS "Authenticated users can add participants when creating conversa" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can update their own participant record" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can view members of their conversations" ON public.conversation_participants;

CREATE POLICY "Conversation creators or owners can add participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = (SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_participants.conversation_id
      AND created_by = (SELECT auth.uid())
  )
);

CREATE POLICY "Participants can update their own participant record"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Participants can view members of their conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (internal.is_conv_participant(conversation_id, (SELECT auth.uid())));

-- Update messages policies with (SELECT auth.uid())
DROP POLICY IF EXISTS "Participants can send messages if conversation is active or req" ON public.messages;
DROP POLICY IF EXISTS "Participants can view conversation messages" ON public.messages;
DROP POLICY IF EXISTS "Sender or recipient can update delivery status" ON public.messages;

CREATE POLICY "Participants can send messages if conversation is active or req"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (sender_id = (SELECT auth.uid()))
  AND internal.is_conv_participant(conversation_id, (SELECT auth.uid()))
);

CREATE POLICY "Participants can view conversation messages"
ON public.messages
FOR SELECT
TO authenticated
USING (internal.is_conv_participant(conversation_id, (SELECT auth.uid())));

CREATE POLICY "Sender or recipient can update delivery status"
ON public.messages
FOR UPDATE
TO authenticated
USING (internal.is_conv_participant(conversation_id, (SELECT auth.uid())))
WITH CHECK (internal.is_conv_participant(conversation_id, (SELECT auth.uid())));

-- Update conversations policies with (SELECT auth.uid())
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Participants can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (internal.is_conv_participant(id, (SELECT auth.uid())))
WITH CHECK (internal.is_conv_participant(id, (SELECT auth.uid())));

CREATE POLICY "Participants can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (internal.is_conv_participant(id, (SELECT auth.uid())));

-- -----------------------------------------------------------------------------
-- 5. RLS INITPLAN OPTIMIZATION (SELECT auth.uid()) FOR ALL REMAINING TABLES
-- -----------------------------------------------------------------------------

-- user_projects
DROP POLICY IF EXISTS "Users can only read own private projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can only insert own private projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can only update own private projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can only delete own private projects" ON public.user_projects;

CREATE POLICY "Users can only read own private projects"
ON public.user_projects FOR SELECT TO public
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can only insert own private projects"
ON public.user_projects FOR INSERT TO public
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can only update own private projects"
ON public.user_projects FOR UPDATE TO public
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can only delete own private projects"
ON public.user_projects FOR DELETE TO public
USING (user_id = (SELECT auth.uid()));

-- published_projects
DROP POLICY IF EXISTS "Authenticated users can publish projects" ON public.published_projects;
DROP POLICY IF EXISTS "Authors can update published projects" ON public.published_projects;
DROP POLICY IF EXISTS "Authors can delete published projects" ON public.published_projects;

CREATE POLICY "Authenticated users can publish projects"
ON public.published_projects FOR INSERT TO authenticated
WITH CHECK (author_id = (SELECT auth.uid()));

CREATE POLICY "Authors can update published projects"
ON public.published_projects FOR UPDATE TO authenticated
USING (author_id = (SELECT auth.uid()));

CREATE POLICY "Authors can delete published projects"
ON public.published_projects FOR DELETE TO authenticated
USING (author_id = (SELECT auth.uid()));

-- community_groups
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.community_groups;
DROP POLICY IF EXISTS "Group creator can update group" ON public.community_groups;
DROP POLICY IF EXISTS "Group owners and admins can delete group" ON public.community_groups;

CREATE POLICY "Authenticated users can create groups"
ON public.community_groups FOR INSERT TO authenticated
WITH CHECK (creator_id = (SELECT auth.uid()));

CREATE POLICY "Group creator can update group"
ON public.community_groups FOR UPDATE TO authenticated
USING (creator_id = (SELECT auth.uid()));

CREATE POLICY "Group owners and admins can delete group"
ON public.community_groups FOR DELETE TO authenticated
USING (public.is_group_admin(id, (SELECT auth.uid())));

-- community_group_posts
DROP POLICY IF EXISTS "Group members can create group posts" ON public.community_group_posts;
DROP POLICY IF EXISTS "Authors can update group posts" ON public.community_group_posts;
DROP POLICY IF EXISTS "Authors and group admins can delete group posts" ON public.community_group_posts;
DROP POLICY IF EXISTS "Public read group posts" ON public.community_group_posts;

CREATE POLICY "Group members can create group posts"
ON public.community_group_posts FOR INSERT TO authenticated
WITH CHECK (
  (author_id = (SELECT auth.uid()))
  AND public.is_group_member(group_id, (SELECT auth.uid()))
);

CREATE POLICY "Authors can update group posts"
ON public.community_group_posts FOR UPDATE TO authenticated
USING (author_id = (SELECT auth.uid()));

CREATE POLICY "Authors and group admins can delete group posts"
ON public.community_group_posts FOR DELETE TO authenticated
USING (
  (author_id = (SELECT auth.uid()))
  OR public.is_group_admin(group_id, (SELECT auth.uid()))
);

CREATE POLICY "Read group posts for public groups or members"
ON public.community_group_posts FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = community_group_posts.group_id
      AND visibility = 'public'
  )
  OR public.is_group_member(group_id, (SELECT auth.uid()))
);

-- community_group_join_requests
DROP POLICY IF EXISTS "Users can create their own join requests" ON public.community_group_join_requests;
DROP POLICY IF EXISTS "Users can read own join requests or group admins can read" ON public.community_group_join_requests;
DROP POLICY IF EXISTS "Group admins can update join requests" ON public.community_group_join_requests;
DROP POLICY IF EXISTS "Users or group admins can delete join requests" ON public.community_group_join_requests;

CREATE POLICY "Users can create their own join requests"
ON public.community_group_join_requests FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can read own join requests or group admins can read"
ON public.community_group_join_requests FOR SELECT TO authenticated
USING (
  (user_id = (SELECT auth.uid()))
  OR public.is_group_admin(group_id, (SELECT auth.uid()))
);

CREATE POLICY "Group admins can update join requests"
ON public.community_group_join_requests FOR UPDATE TO authenticated
USING (public.is_group_admin(group_id, (SELECT auth.uid())))
WITH CHECK (public.is_group_admin(group_id, (SELECT auth.uid())));

CREATE POLICY "Users or group admins can delete join requests"
ON public.community_group_join_requests FOR DELETE TO authenticated
USING (
  (user_id = (SELECT auth.uid()))
  OR public.is_group_admin(group_id, (SELECT auth.uid()))
);

-- user_blocks
DROP POLICY IF EXISTS "Users can block other users" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can read own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can unblock users" ON public.user_blocks;

CREATE POLICY "Users can block other users"
ON public.user_blocks FOR INSERT TO authenticated
WITH CHECK (
  (blocker_id = (SELECT auth.uid()))
  AND ((SELECT auth.uid()) <> blocked_id)
);

CREATE POLICY "Users can read own blocks"
ON public.user_blocks FOR SELECT TO authenticated
USING (blocker_id = (SELECT auth.uid()));

CREATE POLICY "Users can unblock users"
ON public.user_blocks FOR DELETE TO authenticated
USING (blocker_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- 6. FOREIGN KEY COVERING INDEXES (PERFORMANCE OPTIMIZATION)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_group_comments_author ON public.community_group_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.community_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_author ON public.community_group_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_groups_creator ON public.community_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_published_projects_author ON public.published_projects(author_id);

-- -----------------------------------------------------------------------------
-- 7. STORAGE BUCKET SECURITY POLICIES FOR private-media
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload to private-media'
  ) THEN
    CREATE POLICY "Users can upload to private-media"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'private-media'
      AND ((SELECT auth.uid())::text = (storage.foldername(name))[1])
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read own private-media'
  ) THEN
    CREATE POLICY "Users can read own private-media"
    ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id = 'private-media'
      AND ((SELECT auth.uid())::text = (storage.foldername(name))[1])
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own private-media'
  ) THEN
    CREATE POLICY "Users can update own private-media"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'private-media'
      AND ((SELECT auth.uid())::text = (storage.foldername(name))[1])
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own private-media'
  ) THEN
    CREATE POLICY "Users can delete own private-media"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'private-media'
      AND ((SELECT auth.uid())::text = (storage.foldername(name))[1])
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 8. PRODUCT ANALYTICS SYSTEM (PRIVACY-CONSCIOUS USAGE TRACKING)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  app_version text DEFAULT '1.0.0',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow public and authenticated clients to insert validated telemetry events
DROP POLICY IF EXISTS "Allow inserting valid analytics events" ON public.analytics_events;
CREATE POLICY "Allow inserting valid analytics events"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (
  length(event_name) <= 64
  AND length(session_id) <= 128
  AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
);

-- Restrict raw event queries: users can only inspect their own events
DROP POLICY IF EXISTS "Restricted select on analytics events" ON public.analytics_events;
CREATE POLICY "Users can read own analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Covering indexes for fast analytics aggregation
CREATE INDEX IF NOT EXISTS idx_analytics_event_name_created ON public.analytics_events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session_created ON public.analytics_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_created ON public.analytics_events(user_id, created_at);

-- Secured aggregation RPC function for administrator reporting
CREATE OR REPLACE FUNCTION internal.get_analytics_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_total_users integer;
  v_total_projects integer;
  v_total_simulations integer;
  v_successful_simulations integer;
  v_unique_sessions integer;
  v_event_counts jsonb;
BEGIN
  SELECT count(*) INTO v_total_users FROM public.profiles;
  SELECT count(*) INTO v_total_projects FROM public.user_projects;
  SELECT count(*) INTO v_total_simulations FROM public.analytics_events WHERE event_name IN ('simulation_started', 'simulation_succeeded', 'simulation_failed');
  SELECT count(*) INTO v_successful_simulations FROM public.analytics_events WHERE event_name = 'simulation_succeeded';
  SELECT count(DISTINCT session_id) INTO v_unique_sessions FROM public.analytics_events;

  SELECT jsonb_object_agg(event_name, count) INTO v_event_counts
  FROM (
    SELECT event_name, count(*) as count
    FROM public.analytics_events
    GROUP BY event_name
    ORDER BY count DESC
    LIMIT 20
  ) sub;

  RETURN jsonb_build_object(
    'total_registered_users', v_total_users,
    'total_saved_circuits', v_total_projects,
    'unique_sessions', v_unique_sessions,
    'total_simulations', v_total_simulations,
    'successful_simulations', v_successful_simulations,
    'simulation_success_rate', CASE WHEN v_total_simulations > 0 THEN round((v_successful_simulations::numeric / v_total_simulations::numeric) * 100, 1) ELSE 100 END,
    'top_events', coalesce(v_event_counts, '{}'::jsonb),
    'generated_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION internal.get_analytics_summary() TO authenticated, service_role;
DROP FUNCTION IF EXISTS public.get_analytics_summary();
