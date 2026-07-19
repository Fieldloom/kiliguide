-- RUN THIS SCRIPT SECOND

-- Add new fields to profiles table for specific roles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linked_student_id uuid REFERENCES public.profiles(id);

-- Update the new user trigger to assign 'visitor' instead of 'student'
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, preferred_language) 
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), coalesce(new.raw_user_meta_data->>'preferred_language', 'en')) 
  ON CONFLICT(id) DO NOTHING;
  
  -- Assign super_admin to griffinwekesa65@gmail.com, else default to 'visitor'
  IF new.email = 'griffinwekesa65@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) 
    VALUES (new.id, 'super_admin') 
    ON CONFLICT(user_id,role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles(user_id, role) 
    VALUES (new.id, 'visitor') 
    ON CONFLICT(user_id,role) DO NOTHING;
  END IF;
  
  INSERT INTO public.notification_preferences(user_id) 
  VALUES (new.id) 
  ON CONFLICT(user_id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Update the primary_role function to prioritize new admins
CREATE OR REPLACE FUNCTION public.primary_role() 
RETURNS public.app_role 
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() 
  ORDER BY CASE role 
    WHEN 'super_admin' THEN 1 
    WHEN 'administrator' THEN 2 
    WHEN 'dept_admin' THEN 3
    WHEN 'department' THEN 4
    WHEN 'staff' THEN 5
    WHEN 'lecturer' THEN 6
    WHEN 'student' THEN 7
    WHEN 'parent' THEN 8
    ELSE 9 
  END LIMIT 1;
$$;
