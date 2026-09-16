-- Migration: Strict Multi-tenant Isolation across Core Entities

-- 1. Helper function for current user institution
CREATE OR REPLACE FUNCTION public.get_user_institution_id() 
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    (SELECT institution_id FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000001'::uuid
  );
$$;

-- 2. Notices Isolation Policy
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notices read" ON public.notices;
DROP POLICY IF EXISTS "Tenant notices read" ON public.notices;

CREATE POLICY "Tenant notices read" ON public.notices FOR SELECT TO authenticated
USING (
  institution_id IS NULL OR institution_id = public.get_user_institution_id()
);

-- 3. Documents Isolation Policy
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents authenticated read" ON public.documents;
DROP POLICY IF EXISTS "Tenant documents read" ON public.documents;

CREATE POLICY "Tenant documents read" ON public.documents FOR SELECT TO authenticated
USING (
  (status = 'active' OR public.is_admin()) AND
  (institution_id IS NULL OR institution_id = public.get_user_institution_id())
);

-- 4. Tickets Isolation Policy
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tickets participants" ON public.tickets;
DROP POLICY IF EXISTS "Tenant tickets participants" ON public.tickets;

CREATE POLICY "Tenant tickets participants" ON public.tickets FOR SELECT TO authenticated
USING (
  (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin()) AND
  (institution_id IS NULL OR institution_id = public.get_user_institution_id())
);

DROP POLICY IF EXISTS "ticket create" ON public.tickets;
DROP POLICY IF EXISTS "Tenant ticket create" ON public.tickets;
CREATE POLICY "Tenant ticket create" ON public.tickets FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

-- 5. Departments Isolation Policy
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated read departments" ON public.departments;
DROP POLICY IF EXISTS "Tenant departments read" ON public.departments;

CREATE POLICY "Tenant departments read" ON public.departments FOR SELECT TO authenticated
USING (
  institution_id IS NULL OR institution_id = public.get_user_institution_id()
);
