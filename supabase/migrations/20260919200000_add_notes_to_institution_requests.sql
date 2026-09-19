-- Migration: Add notes column to institution_requests
ALTER TABLE public.institution_requests ADD COLUMN IF NOT EXISTS notes TEXT;
