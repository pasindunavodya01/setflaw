-- 001_reset_and_create_tables.sql
-- Drops all tables in the public schema and creates the app tables required by GymSchedule.
-- Run in Supabase SQL editor or a psql connection to your project's DB.

-- Safety: this will remove all data in public schema. Do a backup before running.

BEGIN;

-- Create pgcrypto extension for gen_random_uuid() if missing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop every table in public schema (careful: this drops all app data)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END$$;

-- Create schedules table
CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional: reference auth.users if available in your project
-- This will add a foreign key to the Supabase auth users table (exists in "auth" schema).
-- If your project uses a different users table, adjust accordingly.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    BEGIN
      ALTER TABLE public.schedules
        ADD CONSTRAINT fk_schedules_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN
      -- auth.users not present; skip
      RAISE NOTICE 'auth.users not found; skipping FK creation.';
    END;
  ELSE
    RAISE NOTICE 'auth schema not present; skipping FK creation.';
  END IF;
END$$;

-- Index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules (user_id);

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security and add policies so authenticated users can access their own rows
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to SELECT their rows
CREATE POLICY IF NOT EXISTS "select_own_schedules" ON public.schedules
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: allow authenticated users to INSERT rows tied to their uid
CREATE POLICY IF NOT EXISTS "insert_own_schedules" ON public.schedules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: allow authenticated users to UPDATE their rows
CREATE POLICY IF NOT EXISTS "update_own_schedules" ON public.schedules
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: allow authenticated users to DELETE their rows
CREATE POLICY IF NOT EXISTS "delete_own_schedules" ON public.schedules
  FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;

-- Quick sanity check: return one row (will be empty until you insert)
SELECT 'migration_complete' as status;
