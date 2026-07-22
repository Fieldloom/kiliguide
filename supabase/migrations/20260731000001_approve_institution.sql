-- Migration: Approve Institution RPC and Auto-Admin trigger

CREATE OR REPLACE FUNCTION public.approve_institution(req_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req institution_requests%ROWTYPE;
  v_inst_id UUID;
BEGIN
  -- 1. Check if caller is super_admin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can approve institutions';
  END IF;

  -- 2. Get request
  SELECT * INTO v_req FROM institution_requests WHERE id = req_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending request not found';
  END IF;

  -- 3. Insert into institutions
  INSERT INTO institutions (name, domain, theme_color, logo_url)
  VALUES (v_req.name, v_req.domain, v_req.theme_color, v_req.logo_url)
  ON CONFLICT (domain) DO NOTHING
  RETURNING id INTO v_inst_id;

  -- 4. Update request
  UPDATE institution_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = req_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_institution(req_id UUID, reason TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- 1. Check if caller is super_admin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can reject institutions';
  END IF;

  -- 2. Update request
  UPDATE institution_requests
  SET status = 'rejected', rejection_reason = reason, reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = req_id AND status = 'pending';
END;
$$;

-- Update handle_new_user to assign administrator if they are the admin_email of an approved request
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_assigned_role TEXT := 'student';
  v_inst_id UUID := NULL;
BEGIN
  -- Detect if they are an admin for an approved institution
  IF EXISTS (SELECT 1 FROM institution_requests WHERE admin_email = new.email AND status = 'approved') THEN
    v_assigned_role := 'administrator';
  END IF;

  -- If passed from signup metadata
  IF new.raw_user_meta_data->>'institution_id' IS NOT NULL THEN
    v_inst_id := (new.raw_user_meta_data->>'institution_id')::UUID;
  END IF;

  -- Also auto-assign institution based on domain if not passed explicitly
  IF v_inst_id IS NULL THEN
    SELECT id INTO v_inst_id FROM public.institutions WHERE domain = split_part(new.email, '@', 2) LIMIT 1;
  END IF;

  INSERT INTO public.profiles(id, full_name, preferred_language, institution_id)
  VALUES (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    coalesce(new.raw_user_meta_data->>'preferred_language', 'en'),
    v_inst_id
  )
  ON CONFLICT(id) DO UPDATE SET institution_id = EXCLUDED.institution_id;

  INSERT INTO public.user_roles(user_id, role) VALUES (new.id, v_assigned_role) ON CONFLICT(user_id,role) DO NOTHING;
  
  INSERT INTO public.notification_preferences(user_id) VALUES (new.id) ON CONFLICT(user_id) DO NOTHING;
  RETURN new;
END;
$$;
