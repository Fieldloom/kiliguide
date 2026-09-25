-- Migration: Open Academic Resources Read Policy for All Authenticated & Public Users
-- Ensures student accounts can view all resources uploaded by lecturers & department admins regardless of profile institution_id state.

ALTER TABLE public.academic_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Academic Resources: Read Policy" ON public.academic_resources;
DROP POLICY IF EXISTS "Academic Resources: Write Policy" ON public.academic_resources;

-- Open Read Policy: Any user (student, lecturer, admin, public) can read all published academic resources
CREATE POLICY "Academic Resources: Read Policy" ON public.academic_resources
FOR SELECT
USING (true);

-- Write Policy: Lecturers, Department Admins, Admins, Super Admins & Uploaders can insert/update/delete
CREATE POLICY "Academic Resources: Write Policy" ON public.academic_resources
FOR ALL
USING (
  public.is_super_admin() OR
  public.is_admin() OR
  public.has_role('lecturer') OR
  public.has_role('department') OR
  uploaded_by = auth.uid()
)
WITH CHECK (
  public.is_super_admin() OR
  public.is_admin() OR
  public.has_role('lecturer') OR
  public.has_role('department') OR
  uploaded_by = auth.uid()
);
