-- Migration: Ensure full open write access on academic_resources for authenticated uploaders
-- Fixes RLS permission errors when department admins or lecturers upload course materials.

ALTER TABLE public.academic_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Academic Resources: Read Policy" ON public.academic_resources;
DROP POLICY IF EXISTS "Academic Resources: Write Policy" ON public.academic_resources;

-- Open Read Policy: Anyone (students, lecturers, admins, anon) can read academic resources
CREATE POLICY "Academic Resources: Read Policy" ON public.academic_resources
FOR SELECT USING (true);

-- Open Write Policy for authenticated users: Any authenticated user can insert/update/delete resources
CREATE POLICY "Academic Resources: Write Policy" ON public.academic_resources
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
