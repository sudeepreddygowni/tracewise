-- =============================================================================
-- TRACEWISE POSTGRESQL SCHEMA & ROW LEVEL SECURITY MIGRATION
-- Migration: 20261116000000_init_schema_and_rls.sql
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT NULL,
  skills TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT FALSE,
  privacy JSONB DEFAULT '{"showProjects": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT handle_length CHECK (char_length(handle) >= 3 AND char_length(handle) <= 30),
  CONSTRAINT handle_format CHECK (handle ~* '^[a-z0-9_]+$')
);

-- Case-insensitive unique handle constraint
CREATE UNIQUE INDEX IF NOT EXISTS profiles_handle_lower_idx ON public.profiles (LOWER(handle));

-- -----------------------------------------------------------------------------
-- 2. COMMUNITY POSTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Question', 'Debugging Help', 'Project Update', 'Showcase', 'General Discussion')),
  tags TEXT[] DEFAULT '{}',
  project_reference JSONB DEFAULT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'hidden', 'pending')),
  comment_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON public.community_posts (category);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON public.community_posts (author_id);

-- -----------------------------------------------------------------------------
-- 3. COMMUNITY COMMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  body TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'hidden')),
  likes INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON public.community_comments (author_id);

-- -----------------------------------------------------------------------------
-- 4. COMMUNITY REPORTS TABLE (Private moderation queue)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_reports_status ON public.community_reports (status);
CREATE INDEX IF NOT EXISTS idx_community_reports_reporter ON public.community_reports (reporter_id);

-- -----------------------------------------------------------------------------
-- 5. PITCH LAB PREPARATIONS TABLE (Private to student)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pitch_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  brief JSONB NOT NULL DEFAULT '{}'::jsonb,
  pitches JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT unique_user_project_pitch UNIQUE (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_pitch_preparations_user_proj ON public.pitch_preparations (user_id, project_id);

-- -----------------------------------------------------------------------------
-- 6. PITCH LAB QUESTIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pitch_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT unique_user_project_questions UNIQUE (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_pitch_questions_user_proj ON public.pitch_questions (user_id, project_id);

-- -----------------------------------------------------------------------------
-- 7. PITCH LAB ATTEMPTS TABLE (Quizzes & Mock Interview sessions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pitch_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('quiz', 'mock_interview')),
  score NUMERIC DEFAULT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pitch_attempts_user_project ON public.pitch_attempts (user_id, project_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_attempts ENABLE ROW LEVEL SECURITY;

-- Helper function: is_permanent_user()
-- Checks verified JWT claims to distinguish permanent accounts from anonymous sessions.
CREATE OR REPLACE FUNCTION public.is_permanent_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    auth.uid() IS NOT NULL 
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::BOOLEAN, FALSE) IS NOT TRUE
    AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_anonymous')::BOOLEAN, FALSE) IS NOT TRUE;
$$;

-- -----------------------------------------------------------------------------
-- PROFILES RLS
-- -----------------------------------------------------------------------------
CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update only their own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can delete only their own profile"
  ON public.profiles FOR DELETE
  USING ((select auth.uid()) = id);

-- -----------------------------------------------------------------------------
-- COMMUNITY POSTS RLS
-- -----------------------------------------------------------------------------
CREATE POLICY "Approved community posts are readable by all"
  ON public.community_posts FOR SELECT
  USING (moderation_status = 'approved' OR (select auth.uid()) = author_id);

CREATE POLICY "Permanent users can create posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (
    (select auth.uid()) = author_id
    AND (select public.is_permanent_user())
  );

CREATE POLICY "Authors can update their own posts"
  ON public.community_posts FOR UPDATE
  USING ((select auth.uid()) = author_id AND (select public.is_permanent_user()))
  WITH CHECK ((select auth.uid()) = author_id AND (select public.is_permanent_user()));

CREATE POLICY "Authors can delete their own posts"
  ON public.community_posts FOR DELETE
  USING ((select auth.uid()) = author_id AND (select public.is_permanent_user()));

-- -----------------------------------------------------------------------------
-- COMMUNITY COMMENTS RLS
-- -----------------------------------------------------------------------------
CREATE POLICY "Approved comments are readable by all"
  ON public.community_comments FOR SELECT
  USING (moderation_status = 'approved' OR (select auth.uid()) = author_id);

CREATE POLICY "Permanent users can add comments"
  ON public.community_comments FOR INSERT
  WITH CHECK (
    (select auth.uid()) = author_id
    AND (select public.is_permanent_user())
  );

CREATE POLICY "Authors can update their own comments"
  ON public.community_comments FOR UPDATE
  USING ((select auth.uid()) = author_id AND (select public.is_permanent_user()))
  WITH CHECK ((select auth.uid()) = author_id AND (select public.is_permanent_user()));

CREATE POLICY "Authors can delete their own comments"
  ON public.community_comments FOR DELETE
  USING ((select auth.uid()) = author_id AND (select public.is_permanent_user()));

-- -----------------------------------------------------------------------------
-- COMMUNITY REPORTS RLS (Write-only for reporters, never publicly readable)
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated users can submit reports"
  ON public.community_reports FOR INSERT
  WITH CHECK ((select auth.uid()) = reporter_id);

-- -----------------------------------------------------------------------------
-- PITCH LAB RLS (Strict user isolation)
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own pitch preparations"
  ON public.pitch_preparations FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage their own pitch questions"
  ON public.pitch_questions FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage their own pitch attempts"
  ON public.pitch_attempts FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- =============================================================================
-- DATABASE INTEGRITY & MODERATION TRIGGERS
-- =============================================================================

-- Protect community post fields from tampering on update
CREATE OR REPLACE FUNCTION public.protect_community_post_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.author_id := OLD.author_id;
  NEW.author_handle := OLD.author_handle;
  NEW.comment_count := OLD.comment_count;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := TIMEZONE('utc', NOW());

  IF OLD.moderation_status IN ('flagged', 'hidden') AND NEW.moderation_status = 'approved' THEN
    NEW.moderation_status := OLD.moderation_status;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_protect_community_post_fields
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.protect_community_post_fields();

-- Protect community comments on update
CREATE OR REPLACE FUNCTION public.protect_community_comment_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.author_id := OLD.author_id;
  NEW.author_handle := OLD.author_handle;
  NEW.post_id := OLD.post_id;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := TIMEZONE('utc', NOW());

  IF OLD.moderation_status IN ('flagged', 'hidden') AND NEW.moderation_status = 'approved' THEN
    NEW.moderation_status := OLD.moderation_status;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_protect_community_comment_fields
  BEFORE UPDATE ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.protect_community_comment_fields();

-- Automatically keep comment_count synchronized on post
CREATE OR REPLACE FUNCTION public.sync_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET comment_count = (
      SELECT COUNT(*) FROM public.community_comments 
      WHERE post_id = NEW.post_id AND moderation_status = 'approved'
    )
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET comment_count = (
      SELECT COUNT(*) FROM public.community_comments 
      WHERE post_id = OLD.post_id AND moderation_status = 'approved'
    )
    WHERE id = OLD.post_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.community_posts
    SET comment_count = (
      SELECT COUNT(*) FROM public.community_comments 
      WHERE post_id = NEW.post_id AND moderation_status = 'approved'
    )
    WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_post_comment_count
  AFTER INSERT OR UPDATE OR DELETE ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_comment_count();

-- -----------------------------------------------------------------------------
-- AUTOMATIC PROFILE CREATION & UPGRADE TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_handle TEXT;
  base_handle TEXT;
  is_anon BOOLEAN;
BEGIN
  is_anon := COALESCE(
    (new.raw_app_meta_data->>'is_anonymous')::BOOLEAN,
    (new.raw_user_meta_data->>'is_anonymous')::BOOLEAN,
    FALSE
  );

  IF TG_OP = 'INSERT' THEN
    IF is_anon THEN
      clean_handle := 'guest_' || SUBSTRING(new.id::TEXT FROM 1 FOR 8);
      INSERT INTO public.profiles (id, handle, display_name, bio, is_anonymous)
      VALUES (
        new.id,
        clean_handle,
        'Guest',
        'Exploring circuits and projects on Tracewise as a guest visitor.',
        TRUE
      )
      ON CONFLICT (id) DO NOTHING;
    ELSE
      base_handle := LOWER(REGEXP_REPLACE(COALESCE(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1), 'maker'), '[^a-z0-9_]', '', 'g'));
      IF char_length(base_handle) < 3 THEN
        base_handle := 'maker_' || SUBSTRING(new.id::TEXT FROM 1 FOR 6);
      END IF;
      clean_handle := SUBSTRING(base_handle FROM 1 FOR 20);

      WHILE EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(handle) = LOWER(clean_handle) AND id <> new.id) LOOP
        clean_handle := SUBSTRING(base_handle FROM 1 FOR 20) || '_' || FLOOR(1000 + RANDOM() * 9000)::TEXT;
      END LOOP;

      INSERT INTO public.profiles (id, handle, display_name, bio, avatar_url, is_anonymous)
      VALUES (
        new.id,
        clean_handle,
        COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', 'Student Maker'),
        'Electronics explorer building and debugging circuits on Tracewise.',
        new.raw_user_meta_data->>'avatar_url',
        FALSE
      )
      ON CONFLICT (id) DO UPDATE SET
        is_anonymous = FALSE,
        display_name = COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', profiles.display_name),
        avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', profiles.avatar_url),
        updated_at = NOW();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT is_anon THEN
      UPDATE public.profiles
      SET 
        is_anonymous = FALSE,
        display_name = CASE 
          WHEN display_name = 'Guest' THEN COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Student Maker')
          ELSE display_name 
        END,
        avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', profiles.avatar_url),
        updated_at = NOW()
      WHERE id = new.id;
    END IF;
  END IF;

  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Revoke public execution of internal trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_community_post_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_community_comment_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_post_comment_count() FROM PUBLIC, anon, authenticated;
