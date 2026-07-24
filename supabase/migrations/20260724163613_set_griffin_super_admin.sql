DO $$ 
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'griffinwekesa65@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Remove any existing roles
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    -- Insert super_admin role
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'super_admin');
  END IF;
END $$;
