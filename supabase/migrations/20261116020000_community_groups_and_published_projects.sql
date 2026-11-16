-- Migration: 20261116020000_community_groups_and_published_projects.sql
-- Description: Community Groups MVP (groups, members, group posts) and Published Projects for Unified Search

-- 1. Community Groups
CREATE TABLE IF NOT EXISTS public.community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  avatar_emoji TEXT DEFAULT '⚡',
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creator_name TEXT NOT NULL DEFAULT 'Community Member',
  member_count INTEGER NOT NULL DEFAULT 1,
  post_count INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Community Group Members
CREATE TABLE IF NOT EXISTS public.community_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  user_name TEXT,
  user_handle TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 3. Community Group Posts
CREATE TABLE IF NOT EXISTS public.community_group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  project_reference JSONB,
  likes INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Published Projects (Publicly searchable educational projects)
CREATE TABLE IF NOT EXISTS public.published_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Maker',
  author_handle TEXT NOT NULL DEFAULT 'maker',
  project_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  likes INTEGER NOT NULL DEFAULT 0,
  remix_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all 4 tables
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_projects ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_groups_slug ON public.community_groups(slug);
CREATE INDEX IF NOT EXISTS idx_community_groups_category ON public.community_groups(category);
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON public.community_group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON public.community_group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_published_projects_title ON public.published_projects(title);

-- RLS: community_groups
CREATE POLICY "Public read community groups"
  ON public.community_groups FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON public.community_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Group creator can update group"
  ON public.community_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

-- RLS: community_group_members
CREATE POLICY "Public read group members"
  ON public.community_group_members FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join groups"
  ON public.community_group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave group or creator can remove"
  ON public.community_group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.community_groups WHERE id = group_id AND creator_id = auth.uid()
  ));

-- RLS: community_group_posts
CREATE POLICY "Public read group posts"
  ON public.community_group_posts FOR SELECT
  USING (true);

CREATE POLICY "Group members can create group posts"
  ON public.community_group_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update group posts"
  ON public.community_group_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS: published_projects
CREATE POLICY "Public read published projects"
  ON public.published_projects FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can publish projects"
  ON public.published_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update published projects"
  ON public.published_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- Seed Starter Curated Groups
INSERT INTO public.community_groups (name, slug, description, category, avatar_emoji, creator_name, member_count, post_count, is_verified)
VALUES
  ('Arduino Robotics Lab', 'arduino-robotics', 'Student community building obstacle avoiders, line followers, and motor control systems with Arduino Uno.', 'Robotics', '🤖', 'Tracewise Community', 42, 8, true),
  ('Circuits 101 & Hardware Safety', 'circuits-101', 'Beginner-friendly hardware advice, Ohm’s law formulas, pull-up resistors, and breadboard layout techniques.', 'Education', '⚡', 'Tracewise Community', 89, 15, true),
  ('IoT & Smart Automation', 'iot-automation', 'Interactive electronics, sensor telemetry, automated switches, and state machines for home automation.', 'Automation', '🌐', 'Tracewise Community', 34, 5, true)
ON CONFLICT (slug) DO NOTHING;
