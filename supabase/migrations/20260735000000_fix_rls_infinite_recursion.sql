-- Fix Infinite Recursion in Tenant Isolation RLS Policies

-- Create a SECURITY DEFINER function to fetch the user's institution safely without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM profiles WHERE id = auth.uid();
$$;

-- Update Profiles Policy
DROP POLICY IF EXISTS "Tenant Isolation: Profiles" ON profiles;
CREATE POLICY "Tenant Isolation: Profiles" ON profiles FOR SELECT USING (
  institution_id = public.get_user_institution_id() OR auth.uid() = id
);

-- Update Documents Policy
DROP POLICY IF EXISTS "Tenant Isolation: Documents" ON documents;
CREATE POLICY "Tenant Isolation: Documents" ON documents FOR SELECT USING (
  institution_id = public.get_user_institution_id()
);

-- Update Notices Policy
DROP POLICY IF EXISTS "Tenant Isolation: Notices" ON notices;
CREATE POLICY "Tenant Isolation: Notices" ON notices FOR SELECT USING (
  institution_id = public.get_user_institution_id()
);

-- Update Events Policy
DROP POLICY IF EXISTS "Tenant Isolation: Events" ON calendar_events;
CREATE POLICY "Tenant Isolation: Events" ON calendar_events FOR SELECT USING (
  institution_id = public.get_user_institution_id()
);

-- Update Tickets Policy
DROP POLICY IF EXISTS "Tenant Isolation: Tickets" ON tickets;
CREATE POLICY "Tenant Isolation: Tickets" ON tickets FOR SELECT USING (
  institution_id = public.get_user_institution_id() 
  AND (
      created_by = auth.uid() 
      OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('administrator', 'super_admin'))
  )
);
