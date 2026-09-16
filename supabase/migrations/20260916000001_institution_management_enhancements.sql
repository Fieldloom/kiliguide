-- Migration: Institution Management Enhancements (Status, Messaging & Deletion)

-- 1. Ensure status and contact_email columns on institutions
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending'));
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Update existing NULL statuses to active
UPDATE public.institutions SET status = 'active' WHERE status IS NULL;

-- 2. Enable RLS on institutions table
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin full access to institutions" ON public.institutions;
CREATE POLICY "Superadmin full access to institutions" ON public.institutions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "Public view institutions" ON public.institutions;
CREATE POLICY "Public view institutions" ON public.institutions
  FOR SELECT
  USING (true);

-- 3. Stored Procedure for Safe Institution Deletion by Superadmin
CREATE OR REPLACE FUNCTION public.delete_institution(inst_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Prevent deletion of default system institution
  IF inst_id = '00000000-0000-0000-0000-000000000001'::UUID THEN
    RAISE EXCEPTION 'Cannot delete the default root institution (DeKUT)';
  END IF;

  -- Ensure caller is superadmin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can delete institutions';
  END IF;

  -- Reassign profiles to default institution before deletion
  UPDATE public.profiles SET institution_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE institution_id = inst_id;

  -- Delete associated notices, documents, tickets, calendar_events, departments for this tenant
  DELETE FROM public.notices WHERE institution_id = inst_id;
  DELETE FROM public.documents WHERE institution_id = inst_id;
  DELETE FROM public.tickets WHERE institution_id = inst_id;
  DELETE FROM public.calendar_events WHERE institution_id = inst_id;
  DELETE FROM public.departments WHERE institution_id = inst_id;

  -- Finally delete institution row
  DELETE FROM public.institutions WHERE id = inst_id;
END;
$$;
