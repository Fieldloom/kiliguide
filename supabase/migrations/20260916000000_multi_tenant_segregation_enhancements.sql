-- Migration: Multi-tenant Institution Segregation & Auto Domain Resolver

-- 1. Helper RPC to list approved institutions for dynamic registration dropdowns
CREATE OR REPLACE FUNCTION public.get_approved_institutions()
RETURNS TABLE (
  id UUID,
  name TEXT,
  domain TEXT,
  theme_color TEXT,
  logo_url TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, domain, theme_color, logo_url
  FROM public.institutions
  ORDER BY name ASC;
$$;

-- Grant execution to public & anon users for signup page dropdown
GRANT EXECUTE ON FUNCTION public.get_approved_institutions() TO anon, authenticated;

-- 2. Enhance handle_new_user trigger with fail-safe institution assignment
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_assigned_role TEXT := 'student';
  v_inst_id UUID := NULL;
BEGIN
  -- Detect if they are an admin for an approved institution
  IF EXISTS (SELECT 1 FROM institution_requests WHERE admin_email = new.email AND status = 'approved') THEN
    v_assigned_role := 'administrator';
    SELECT id INTO v_inst_id FROM public.institutions WHERE domain = split_part(new.email, '@', 2) LIMIT 1;
  END IF;

  -- 1. Check signup metadata institution_id
  IF v_inst_id IS NULL AND new.raw_user_meta_data->>'institution_id' IS NOT NULL AND new.raw_user_meta_data->>'institution_id' != '' THEN
    v_inst_id := (new.raw_user_meta_data->>'institution_id')::UUID;
  END IF;

  -- 2. Auto-assign based on email domain (e.g. students.dkut.ac.ke -> dkut.ac.ke)
  IF v_inst_id IS NULL THEN
    SELECT id INTO v_inst_id FROM public.institutions 
    WHERE split_part(new.email, '@', 2) LIKE '%' || domain || '%' 
       OR domain LIKE '%' || split_part(new.email, '@', 2) || '%'
    LIMIT 1;
  END IF;

  -- 3. Fallback to primary default institution (DeKUT)
  IF v_inst_id IS NULL THEN
    v_inst_id := '00000000-0000-0000-0000-000000000001'::UUID;
  END IF;

  INSERT INTO public.profiles(id, full_name, preferred_language, institution_id)
  VALUES (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    coalesce(new.raw_user_meta_data->>'preferred_language', 'en'),
    v_inst_id
  )
  ON CONFLICT(id) DO UPDATE SET 
    institution_id = coalesce(profiles.institution_id, EXCLUDED.institution_id),
    full_name = coalesce(profiles.full_name, EXCLUDED.full_name);

  INSERT INTO public.user_roles(user_id, role) VALUES (new.id, v_assigned_role) ON CONFLICT(user_id,role) DO NOTHING;
  
  INSERT INTO public.notification_preferences(user_id) VALUES (new.id) ON CONFLICT(user_id) DO NOTHING;
  RETURN new;
END;
$$;
