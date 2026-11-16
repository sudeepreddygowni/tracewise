-- =============================================================================
-- TRACEWISE POSTGRESQL SCHEMA & ROW LEVEL SECURITY MIGRATION
-- Migration: 20261116000000_init_schema_and_rls.sql
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE INDEX IF NOT EXISTS idx_pitch_preparations_user ON public.pitch_preparations (user_id);

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

-- Helper function to check if current caller is permanent (not anonymous)
CREATE OR REPLACE FUNCTION public.is_permanent_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'is_anonymous')::BOOLEAN IS NOT TRUE;
$$;

-- -----------------------------------------------------------------------------
-- PROFILES RLS
-- -----------------------------------------------------------------------------
CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update only their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete only their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- COMMUNITY POSTS RLS
-- -----------------------------------------------------------------------------
CREATE POLICY "Approved community posts are readable by all"
  ON public.community_posts FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = author_id);

CREATE POLICY "Permanent users can create posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND public.is_permanent_user()
  );

CREATE POLICY "Authors can update their own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = author_id AND public.is_permanent_user())
  WITH CHECK (auth.uid() = author_id AND public.is_permanent_user());

CREATE POLICY "Authors can delete their own posts"
  ON public.community_posts FOR DELETE
  USING (auth.uid() = author_id AND public.is_permanent_user());

-- -----------------------------------------------------------------------------
-- COMMUNITY COMMENTS RLS
-- -----------------------------------------------------------------------------
CREATE POLICY "Approved comments are readable by all"
  ON public.community_comments FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = author_id);

CREATE POLICY "Permanent users can add comments"
  ON public.community_comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND public.is_permanent_user()
  );

CREATE POLICY "Authors can update their own comments"
  ON public.community_comments FOR UPDATE
  USING (auth.uid() = author_id AND public.is_permanent_user())
  WITH CHECK (auth.uid() = author_id AND public.is_permanent_user());

CREATE POLICY "Authors can delete their own comments"
  ON public.community_comments FOR DELETE
  USING (auth.uid() = author_id AND public.is_permanent_user());

-- -----------------------------------------------------------------------------
-- COMMUNITY REPORTS RLS (Write-only for users, never publicly readable)
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated users can submit reports"
  ON public.community_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- -----------------------------------------------------------------------------
-- PITCH LAB RLS (Strict user isolation)
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own pitch preparations"
  ON public.pitch_preparations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own pitch questions"
  ON public.pitch_questions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own pitch attempts"
  ON public.pitch_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- AUTOMATIC PROFILE CREATION TRIGGER
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
  is_anon := COALESCE((new.raw_app_meta_data->>'is_anonymous')::BOOLEAN, FALSE);

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
    base_handle := LOWER(REGEXP_REPLACE(COALESCE(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1), 'student'), '[^a-z0-9_]', '', 'g'));
    IF char_length(base_handle) < 3 THEN
      base_handle := 'maker_' || SUBSTRING(new.id::TEXT FROM 1 FOR 6);
    END IF;
    clean_handle := SUBSTRING(base_handle FROM 1 FOR 20);

    -- Ensure handle uniqueness if conflict occurs
    IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(handle) = LOWER(clean_handle)) THEN
      clean_handle := clean_handle || '_' || FLOOR(100 + RANDOM() * 900)::TEXT;
    END IF;

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
      display_name = EXCLUDED.display_name,
      updated_at = NOW();
  END IF;

  RETURN new;
END;
$$;

-- Create trigger on auth.users (runs on signup or anonymous signin)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
