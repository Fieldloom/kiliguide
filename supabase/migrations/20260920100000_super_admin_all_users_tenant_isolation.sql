-- Migration: Multi-Tenant RLS Policy Update for Profiles & Core Entities
-- Super admins can view all users across all institutions
-- Institution admins can view only users belonging to their institution

-- 1. Helper function for super admin check
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- 2. Profiles RLS Policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation: Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

CREATE POLICY "Tenant Isolation: Profiles" ON public.profiles FOR SELECT USING (
  public.is_super_admin() OR
  institution_id = public.get_user_institution_id() OR
  auth.uid() = id
);

-- 3. Documents RLS Policy
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant documents read" ON public.documents;
DROP POLICY IF EXISTS "Tenant Isolation: Documents" ON public.documents;

CREATE POLICY "Tenant documents read" ON public.documents FOR SELECT TO authenticated
USING (
  public.is_super_admin() OR
  (
    (status = 'active' OR public.is_admin()) AND
    (institution_id IS NULL OR institution_id = public.get_user_institution_id())
  )
);

-- 4. Tickets RLS Policy
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant tickets participants" ON public.tickets;
DROP POLICY IF EXISTS "Tenant Isolation: Tickets" ON public.tickets;

CREATE POLICY "Tenant tickets participants" ON public.tickets FOR SELECT TO authenticated
USING (
  public.is_super_admin() OR
  (
    (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin()) AND
    (institution_id IS NULL OR institution_id = public.get_user_institution_id())
  )
);

-- 5. Notices RLS Policy
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant notices read" ON public.notices;
DROP POLICY IF EXISTS "Tenant Isolation: Notices" ON public.notices;

CREATE POLICY "Tenant notices read" ON public.notices FOR SELECT TO authenticated
USING (
  public.is_super_admin() OR
  institution_id IS NULL OR 
  institution_id = public.get_user_institution_id()
);

-- 6. Departments RLS Policy
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant departments read" ON public.departments;

CREATE POLICY "Tenant departments read" ON public.departments FOR SELECT TO authenticated
USING (
  public.is_super_admin() OR
  institution_id IS NULL OR 
  institution_id = public.get_user_institution_id()
);
