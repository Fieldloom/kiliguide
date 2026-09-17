-- Migration: Enforce Admin Upload Isolation on Documents RLS

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop previous write policy if it allowed all admins to modify any document
DROP POLICY IF EXISTS "documents admin write" ON public.documents;
DROP POLICY IF EXISTS "documents admin upload isolation" ON public.documents;

-- Create policy allowing regular admins to manage only their own uploads, super_admin to manage all
CREATE POLICY "documents admin upload isolation" ON public.documents 
FOR ALL TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  uploaded_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);
