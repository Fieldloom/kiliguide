-- Migration: Notice Department Targeting & Filtering
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_notices_department_id ON public.notices(department_id);
CREATE INDEX IF NOT EXISTS idx_notices_institution_id ON public.notices(institution_id);
