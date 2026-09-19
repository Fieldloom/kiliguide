-- Migration: Institution Departments & Escalations Management Policy
-- Allows institution administrators to add and manage custom contact emails for ticketing & escalation

-- 0. Ensure public.is_super_admin() helper function exists
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- 1. Drop old global unique constraint on name to allow multi-tenant departments
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_name_key;

-- 2. Add per-tenant unique constraint for (institution_id, name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'departments_institution_id_name_key'
  ) THEN
    ALTER TABLE public.departments ADD CONSTRAINT departments_institution_id_name_key UNIQUE (institution_id, name);
  END IF;
END $$;

-- 3. Update Row Level Security for departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage departments" ON public.departments;
DROP POLICY IF EXISTS "Tenant departments manage" ON public.departments;
DROP POLICY IF EXISTS "Tenant departments write" ON public.departments;
DROP POLICY IF EXISTS "Tenant departments read" ON public.departments;

CREATE POLICY "Tenant departments read" ON public.departments FOR SELECT TO authenticated
USING (
  institution_id IS NULL OR institution_id = public.get_user_institution_id() OR public.is_super_admin()
);

CREATE POLICY "Tenant departments write" ON public.departments FOR ALL TO authenticated
USING (
  public.is_admin() AND (institution_id = public.get_user_institution_id() OR public.is_super_admin())
)
WITH CHECK (
  public.is_admin() AND (institution_id = public.get_user_institution_id() OR public.is_super_admin())
);
