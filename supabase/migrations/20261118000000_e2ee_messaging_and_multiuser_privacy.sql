-- =============================================================================
-- TRACEWISE MIGRATION: E2EE MESSAGING IDENTITY, DEVICE KEYS & MULTI-USER PRIVACY
-- Migration: 20261118000000_e2ee_messaging_and_multiuser_privacy.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DEVICE CRYPTOGRAPHIC IDENTITIES (Public Keys for ECDH P-256 Key Agreement)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_crypto_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  public_key JSONB NOT NULL,
  key_type TEXT NOT NULL DEFAULT 'ECDH-P256',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_user_crypto_devices_user ON public.user_crypto_devices(user_id);
ALTER TABLE public.user_crypto_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view public keys to establish shared secrets & encrypt messages
DROP POLICY IF EXISTS "Authenticated users can view public device keys" ON public.user_crypto_devices;
CREATE POLICY "Authenticated users can view public device keys"
  ON public.user_crypto_devices FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users manage their own device keys
DROP POLICY IF EXISTS "Users can insert their own device keys" ON public.user_crypto_devices;
CREATE POLICY "Users can insert their own device keys"
  ON public.user_crypto_devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own device keys" ON public.user_crypto_devices;
CREATE POLICY "Users can update their own device keys"
  ON public.user_crypto_devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own device keys" ON public.user_crypto_devices;
CREATE POLICY "Users can delete their own device keys"
  ON public.user_crypto_devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_crypto_devices TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. EXTEND MESSAGES TABLE FOR E2EE CIPHERTEXT & ATTACHMENT METADATA
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS encrypted_payload JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sender_device_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS encryption_version TEXT DEFAULT 'v1-ecdh-aes-gcm';

-- -----------------------------------------------------------------------------
-- 3. ENSURE STRICT RLS ON USER PROJECTS TABLE (Multi-User Data Isolation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  project_data JSONB NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON public.user_projects(user_id);
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view only their own projects or public projects" ON public.user_projects;
CREATE POLICY "Users can view only their own projects or public projects"
  ON public.user_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_private = FALSE);

DROP POLICY IF EXISTS "Users can insert their own projects" ON public.user_projects;
CREATE POLICY "Users can insert their own projects"
  ON public.user_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update only their own projects" ON public.user_projects;
CREATE POLICY "Users can update only their own projects"
  ON public.user_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete only their own projects" ON public.user_projects;
CREATE POLICY "Users can delete only their own projects"
  ON public.user_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_projects TO authenticated;
