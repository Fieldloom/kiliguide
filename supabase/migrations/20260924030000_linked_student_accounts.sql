-- Create linked_student_accounts table for secure portal credential vault & cached sync data
CREATE TABLE IF NOT EXISTS public.linked_student_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  portal_username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  cached_portal_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT linked_student_accounts_user_inst_unique UNIQUE (user_id, institution_id)
);

-- Enable Row-Level Security
ALTER TABLE public.linked_student_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own linked portal account" ON public.linked_student_accounts;
DROP POLICY IF EXISTS "Users can insert their own linked portal account" ON public.linked_student_accounts;
DROP POLICY IF EXISTS "Users can update their own linked portal account" ON public.linked_student_accounts;
DROP POLICY IF EXISTS "Users can delete their own linked portal account" ON public.linked_student_accounts;

-- Strictly enforce user isolation
CREATE POLICY "Users can view their own linked portal account"
  ON public.linked_student_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own linked portal account"
  ON public.linked_student_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own linked portal account"
  ON public.linked_student_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own linked portal account"
  ON public.linked_student_accounts FOR DELETE
  USING (auth.uid() = user_id);
