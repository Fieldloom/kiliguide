-- Migration: Fix institution approval role elevation and auto-administrator assignment

CREATE OR REPLACE FUNCTION public.approve_institution(req_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.institution_requests%ROWTYPE;
  v_inst_id UUID;
  v_target_user_id UUID;
BEGIN
  -- 1. Check if caller is super_admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can approve institutions';
  END IF;

  -- 2. Get pending request
  SELECT * INTO v_req FROM public.institution_requests WHERE id = req_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending request not found';
  END IF;

  -- 3. Insert or get institution
  INSERT INTO public.institutions (name, domain, theme_color, logo_url)
  VALUES (v_req.name, v_req.domain, coalesce(v_req.theme_color, '#10b981'), v_req.logo_url)
  ON CONFLICT (domain) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_inst_id;

  IF v_inst_id IS NULL THEN
    SELECT id INTO v_inst_id FROM public.institutions WHERE domain = v_req.domain LIMIT 1;
  END IF;

  -- 4. Mark request as approved
  UPDATE public.institution_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = req_id;

  -- 5. Elevate existing user matching admin_email to 'administrator' role & assign institution_id
  SELECT id INTO v_target_user_id FROM auth.users WHERE lower(email) = lower(v_req.admin_email) LIMIT 1;
  IF v_target_user_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET institution_id = v_inst_id 
    WHERE id = v_target_user_id;

    DELETE FROM public.user_roles WHERE user_id = v_target_user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_target_user_id, 'administrator')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Retroactive fix for any existing approved institution requests
DO $$
DECLARE
  r RECORD;
  v_inst_id UUID;
  v_uid UUID;
BEGIN
  FOR r IN SELECT * FROM public.institution_requests WHERE status = 'approved' LOOP
    SELECT id INTO v_inst_id FROM public.institutions WHERE domain = r.domain LIMIT 1;
    SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(r.admin_email) LIMIT 1;
    IF v_uid IS NOT NULL AND v_inst_id IS NOT NULL THEN
      UPDATE public.profiles SET institution_id = v_inst_id WHERE id = v_uid;
      DELETE FROM public.user_roles WHERE user_id = v_uid;
      INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'administrator') ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
