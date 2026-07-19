-- Update the new user trigger to assign roles based on metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  assigned_role public.app_role := 'visitor';
  meta_role text := new.raw_user_meta_data->>'role';
BEGIN
  -- Determine Role
  IF new.email = 'griffinwekesa65@gmail.com' THEN
    assigned_role := 'super_admin';
  ELSIF meta_role IN ('student', 'staff', 'parent', 'visitor') THEN
    assigned_role := meta_role::public.app_role;
  END IF;

  -- Insert Profile with Metadata
  INSERT INTO public.profiles(
    id, 
    full_name, 
    preferred_language, 
    registration_number, 
    department_id
  ) 
  VALUES (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    coalesce(new.raw_user_meta_data->>'preferred_language', 'en'),
    NULLIF(new.raw_user_meta_data->>'registration_number', ''),
    NULLIF(new.raw_user_meta_data->>'department_id', '')::uuid
  ) 
  ON CONFLICT(id) DO NOTHING;
  
  -- Insert Role
  INSERT INTO public.user_roles(user_id, role) 
  VALUES (new.id, assigned_role) 
  ON CONFLICT(user_id,role) DO NOTHING;
  
  -- Insert Notification Prefs
  INSERT INTO public.notification_preferences(user_id) 
  VALUES (new.id) 
  ON CONFLICT(user_id) DO NOTHING;
  
  RETURN new;
END;
$$;
