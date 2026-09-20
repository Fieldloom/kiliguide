-- Fix Documents RLS write permissions for Department Admins and Staff

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents admin upload isolation" ON public.documents;
DROP POLICY IF EXISTS "documents write policy" ON public.documents;
DROP POLICY IF EXISTS "Tenant documents insert" ON public.documents;
DROP POLICY IF EXISTS "Tenant documents update delete" ON public.documents;

CREATE POLICY "Tenant documents insert" ON public.documents
FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  OR uploaded_by IS NULL
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (institution_id = public.documents.institution_id OR role IN ('super_admin', 'administrator', 'dept_admin'))
  )
);

CREATE POLICY "Tenant documents update delete" ON public.documents
FOR ALL TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'administrator', 'dept_admin')
  )
);
