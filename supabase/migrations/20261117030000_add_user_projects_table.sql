-- Migration: 20261117030000_add_user_projects_table.sql
-- Description: Add user_projects table with strict per-student Row-Level Security for persistent cloud projects.

CREATE TABLE IF NOT EXISTS public.user_projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  project_data JSONB NOT NULL,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_projects' AND policyname = 'Users can only read own private projects') THEN
    CREATE POLICY "Users can only read own private projects"
      ON public.user_projects FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_projects' AND policyname = 'Users can only insert own private projects') THEN
    CREATE POLICY "Users can only insert own private projects"
      ON public.user_projects FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_projects' AND policyname = 'Users can only update own private projects') THEN
    CREATE POLICY "Users can only update own private projects"
      ON public.user_projects FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_projects' AND policyname = 'Users can only delete own private projects') THEN
    CREATE POLICY "Users can only delete own private projects"
      ON public.user_projects FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON public.user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_updated_at ON public.user_projects(updated_at DESC);
