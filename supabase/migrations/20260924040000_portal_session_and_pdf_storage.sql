-- Add session cookie caching & PDF download URL columns to linked_student_accounts
ALTER TABLE public.linked_student_accounts
ADD COLUMN IF NOT EXISTS encrypted_session_cookies TEXT,
ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pdf_download_url TEXT;
