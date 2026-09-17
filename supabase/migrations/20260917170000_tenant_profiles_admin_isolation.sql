-- Migration: Enforce Tenant Profile Isolation for Admins on Profiles RLS

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation: Profiles" ON public.profiles;

CREATE POLICY "Tenant Isolation: Profiles" ON public.profiles FOR SELECT TO authenticated
USING (
  -- Super admin can view all profiles
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  -- Regular users or institution admins can view profiles in their institution or their own profile
  OR institution_id = (SELECT institution_id FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() = id
);
