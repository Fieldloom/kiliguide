-- Migration: Ticket Chat 2-Way Messaging & RLS Policies
-- Ensures secure 2-way conversation threads between ticket submitters and department administrators.

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- 1. Tickets Policies
DROP POLICY IF EXISTS "Tenant tickets select" ON public.tickets;
DROP POLICY IF EXISTS "Tenant tickets insert" ON public.tickets;
DROP POLICY IF EXISTS "Tenant tickets update" ON public.tickets;
DROP POLICY IF EXISTS "Tenant tickets participants" ON public.tickets;
DROP POLICY IF EXISTS "Tenant Isolation: Tickets" ON public.tickets;
DROP POLICY IF EXISTS "ticket create" ON public.tickets;

CREATE POLICY "Tenant tickets select" ON public.tickets FOR SELECT TO authenticated
USING (
  created_by = auth.uid() 
  OR assigned_to = auth.uid() 
  OR public.is_super_admin()
  OR (public.is_admin() AND (institution_id IS NULL OR institution_id = public.get_user_institution_id()))
);

CREATE POLICY "Tenant tickets insert" ON public.tickets FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "Tenant tickets update" ON public.tickets FOR UPDATE TO authenticated
USING (
  created_by = auth.uid() 
  OR assigned_to = auth.uid() 
  OR public.is_super_admin()
  OR (public.is_admin() AND (institution_id IS NULL OR institution_id = public.get_user_institution_id()))
);

-- 2. Ticket Messages Policies
DROP POLICY IF EXISTS "ticket messages participants" ON public.ticket_messages;
DROP POLICY IF EXISTS "ticket messages create" ON public.ticket_messages;
DROP POLICY IF EXISTS "Tenant ticket_messages select" ON public.ticket_messages;
DROP POLICY IF EXISTS "Tenant ticket_messages insert" ON public.ticket_messages;

CREATE POLICY "Tenant ticket_messages select" ON public.ticket_messages FOR SELECT TO authenticated
USING (
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_messages.ticket_id
    AND (
      t.created_by = auth.uid()
      OR t.assigned_to = auth.uid()
      OR public.is_super_admin()
      OR (public.is_admin() AND (t.institution_id IS NULL OR t.institution_id = public.get_user_institution_id()))
    )
  )
);

CREATE POLICY "Tenant ticket_messages insert" ON public.ticket_messages FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_messages.ticket_id
    AND (
      t.created_by = auth.uid()
      OR t.assigned_to = auth.uid()
      OR public.is_super_admin()
      OR (public.is_admin() AND (t.institution_id IS NULL OR t.institution_id = public.get_user_institution_id()))
    )
  )
);
