-- 002_create_body_weights.sql
-- Creates the body_weights table for tracking body weight history.
-- Run in Supabase SQL editor (safe to run on an existing project).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.body_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weight numeric(6, 2) NOT NULL CHECK (weight > 0 AND weight < 10000),
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    BEGIN
      ALTER TABLE public.body_weights
        ADD CONSTRAINT fk_body_weights_user
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN
        RAISE NOTICE 'auth.users not found; skipping FK creation.';
    END;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_body_weights_user_id ON public.body_weights (user_id);
CREATE INDEX IF NOT EXISTS idx_body_weights_user_recorded_at
  ON public.body_weights (user_id, recorded_at DESC, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_body_weights_set_updated_at ON public.body_weights;
CREATE TRIGGER trg_body_weights_set_updated_at
BEFORE UPDATE ON public.body_weights
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.body_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_body_weights" ON public.body_weights;
CREATE POLICY "select_own_body_weights" ON public.body_weights
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_body_weights" ON public.body_weights;
CREATE POLICY "insert_own_body_weights" ON public.body_weights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_body_weights" ON public.body_weights;
CREATE POLICY "update_own_body_weights" ON public.body_weights
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_body_weights" ON public.body_weights;
CREATE POLICY "delete_own_body_weights" ON public.body_weights
  FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;

SELECT 'body_weights_migration_complete' AS status;
