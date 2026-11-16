-- =============================================================================
-- TRACEWISE MIGRATION: ADD LINKEDIN URL TO PROFILES
-- Migration: 20261116010000_add_linkedin_url_to_profiles.sql
-- =============================================================================

-- Add optional linkedin_url column to public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT NULL;

-- Validate URL format when provided (must be HTTPS LinkedIn profile or organization link)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_linkedin_url_format'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT check_linkedin_url_format
    CHECK (
      linkedin_url IS NULL OR 
      linkedin_url = '' OR
      linkedin_url ~* '^https:\/\/([a-z0-9\-]+\.)?linkedin\.com\/(in|company|school|pub)\/[a-zA-Z0-9_\-\.%]+\/?$'
    );
  END IF;
END $$;
