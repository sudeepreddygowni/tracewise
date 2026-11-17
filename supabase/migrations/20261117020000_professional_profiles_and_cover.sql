-- TRACEWISE MIGRATION: 20261117020000_professional_profiles_and_cover.sql
-- Add professional engineering portfolio fields to public.profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS about TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS github_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS website_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS education TEXT DEFAULT '';

-- Comments for documentation
COMMENT ON COLUMN public.profiles.headline IS 'Professional headline e.g. Student Maker | Arduino | Embedded Systems';
COMMENT ON COLUMN public.profiles.about IS 'Comprehensive summary of maker interests and engineering journey';
COMMENT ON COLUMN public.profiles.cover_url IS 'Public storage URL for wide banner photo';
COMMENT ON COLUMN public.profiles.github_url IS 'External GitHub profile link';
COMMENT ON COLUMN public.profiles.website_url IS 'External personal portfolio link';
COMMENT ON COLUMN public.profiles.education IS 'Optional learning background or degree info';
