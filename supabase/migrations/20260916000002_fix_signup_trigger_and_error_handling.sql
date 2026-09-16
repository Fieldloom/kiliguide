-- Migration: Bulletproof handle_new_user trigger and error protection

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_assigned_role public.app_role := 'student'::public.app_role;
  v_inst_id UUID := NULL;
  v_meta_role TEXT;
  v_raw_inst_id TEXT;
  v_dept_id UUID := NULL;
  v_raw_dept_id TEXT;
BEGIN
  -- Safe role detection from metadata
  v_meta_role := new.raw_user_meta_data->>'role';
  IF new.email = 'griffinwekesa65@gmail.com' THEN
    v_assigned_role := 'super_admin'::public.app_role;
  ELSIF EXISTS (SELECT 1 FROM public.institution_requests WHERE admin_email = new.email AND status = 'approved') THEN
    v_assigned_role := 'administrator'::public.app_role;
    SELECT id INTO v_inst_id FROM public.institutions WHERE domain = split_part(new.email, '@', 2) LIMIT 1;
  ELSIF v_meta_role IN ('student', 'staff', 'parent', 'visitor', 'administrator', 'super_admin', 'dept_admin', 'lecturer', 'department') THEN
    BEGIN
      v_assigned_role := v_meta_role::public.app_role;
    EXCEPTION WHEN OTHERS THEN
      v_assigned_role := 'student'::public.app_role;
    END;
  END IF;

  -- Safe institution_id detection
  v_raw_inst_id := new.raw_user_meta_data->>'institution_id';
  IF v_raw_inst_id IS NOT NULL AND v_raw_inst_id != '' AND v_raw_inst_id != 'null' THEN
    BEGIN
      v_inst_id := v_raw_inst_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_inst_id := NULL;
    END;
  END IF;

  -- Auto-assign based on email domain if needed
  IF v_inst_id IS NULL THEN
    SELECT id INTO v_inst_id FROM public.institutions 
    WHERE split_part(new.email, '@', 2) LIKE '%' || domain || '%' 
       OR domain LIKE '%' || split_part(new.email, '@', 2) || '%'
    LIMIT 1;
  END IF;

  -- Default fallback institution (DeKUT)
  IF v_inst_id IS NULL THEN
    v_inst_id := '00000000-0000-0000-0000-000000000001'::UUID;
  END IF;

  -- Safe department_id detection
  v_raw_dept_id := new.raw_user_meta_data->>'department_id';
  IF v_raw_dept_id IS NOT NULL AND v_raw_dept_id != '' AND v_raw_dept_id != 'null' THEN
    BEGIN
      v_dept_id := v_raw_dept_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_dept_id := NULL;
    END;
  END IF;

  -- Upsert Profile
  BEGIN
    INSERT INTO public.profiles(
      id, 
      full_name, 
      preferred_language, 
      institution_id,
      registration_number,
      department_id
    )
    VALUES (
      new.id, 
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
      coalesce(new.raw_user_meta_data->>'preferred_language', 'en'),
      v_inst_id,
      NULLIF(new.raw_user_meta_data->>'registration_number', ''),
      v_dept_id
    )
    ON CONFLICT(id) DO UPDATE SET 
      institution_id = coalesce(profiles.institution_id, EXCLUDED.institution_id),
      full_name = coalesce(profiles.full_name, EXCLUDED.full_name),
      registration_number = coalesce(profiles.registration_number, EXCLUDED.registration_number),
      department_id = coalesce(profiles.department_id, EXCLUDED.department_id);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.profiles(id, full_name, preferred_language, institution_id)
    VALUES (new.id, split_part(new.email, '@', 1), 'en', '00000000-0000-0000-0000-000000000001'::UUID)
    ON CONFLICT(id) DO NOTHING;
  END;

  -- Insert User Role
  BEGIN
    INSERT INTO public.user_roles(user_id, role) 
    VALUES (new.id, v_assigned_role) 
    ON CONFLICT(user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Insert Notification Prefs
  BEGIN
    INSERT INTO public.notification_preferences(user_id) 
    VALUES (new.id) 
    ON CONFLICT(user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$;
