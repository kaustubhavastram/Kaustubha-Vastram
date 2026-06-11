-- ============================================================
-- Add phone and address columns to profiles table
-- ============================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
