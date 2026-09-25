-- Migration: Academic Resources Module Schema & Multi-Tenant RLS
-- Creates academic_resources table for storing course materials, lecture notes, past papers, and study guides.

CREATE TABLE IF NOT EXISTS public.academic_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT,
  academic_year TEXT DEFAULT 'Year 1',
  semester TEXT DEFAULT 'Semester 1',
  resource_type TEXT NOT NULL CHECK (resource_type IN ('lecture_note', 'past_paper', 'course_material', 'study_guide', 'syllabus')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_type TEXT DEFAULT 'pdf',
  description TEXT,
  download_count INT DEFAULT 0,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploader_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.academic_resources ENABLE ROW LEVEL SECURITY;

-- Indexes for fast searching & filtering
CREATE INDEX IF NOT EXISTS idx_academic_resources_inst ON public.academic_resources(institution_id);
CREATE INDEX IF NOT EXISTS idx_academic_resources_dept ON public.academic_resources(department_id);
CREATE INDEX IF NOT EXISTS idx_academic_resources_course ON public.academic_resources(course_code);
CREATE INDEX IF NOT EXISTS idx_academic_resources_type ON public.academic_resources(resource_type);

-- RLS Policies
DROP POLICY IF EXISTS "Academic Resources: Read Policy" ON public.academic_resources;
CREATE POLICY "Academic Resources: Read Policy" ON public.academic_resources
FOR SELECT TO authenticated
USING (
  public.is_super_admin() OR
  institution_id IS NULL OR
  institution_id = public.get_user_institution_id()
);

DROP POLICY IF EXISTS "Academic Resources: Write Policy" ON public.academic_resources;
CREATE POLICY "Academic Resources: Write Policy" ON public.academic_resources
FOR ALL TO authenticated
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

-- Storage bucket for academic resources
INSERT INTO storage.buckets (id, name, public) 
VALUES ('academic_resources', 'academic_resources', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage object access policies
DROP POLICY IF EXISTS "Public read academic resources bucket" ON storage.objects;
CREATE POLICY "Public read academic resources bucket" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'academic_resources');

DROP POLICY IF EXISTS "Authenticated write academic resources bucket" ON storage.objects;
CREATE POLICY "Authenticated write academic resources bucket" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'academic_resources');

DROP POLICY IF EXISTS "Authenticated delete academic resources bucket" ON storage.objects;
CREATE POLICY "Authenticated delete academic resources bucket" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'academic_resources');
