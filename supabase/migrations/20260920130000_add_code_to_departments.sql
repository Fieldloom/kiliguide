-- Migration: Add code column to public.departments if missing

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'departments' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.departments ADD COLUMN code TEXT;
  END IF;
END $$;
