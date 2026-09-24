-- Migration: Self-Service Account Deletion RPC
-- Allows authenticated users to permanently delete their account and associated profile data safely.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Unlink user references in audit / shared content tables so deletion succeeds cleanly
  UPDATE public.documents SET uploaded_by = NULL WHERE uploaded_by = v_uid;
  UPDATE public.notices SET created_by = NULL WHERE created_by = v_uid;
  UPDATE public.tickets SET created_by = NULL WHERE created_by = v_uid;
  UPDATE public.calendar_events SET created_by = NULL WHERE created_by = v_uid;

  -- 2. Delete user-owned records
  DELETE FROM public.user_roles WHERE user_id = v_uid;
  DELETE FROM public.profiles WHERE id = v_uid;

  -- 3. Delete auth account
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
