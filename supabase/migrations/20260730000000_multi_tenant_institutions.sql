-- Migration: Evolve into Multi-Tenant SaaS

-- 1. Create Institutions Table
CREATE TABLE public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    theme_color TEXT DEFAULT '#10b981',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Institution (DeKUT) so existing data doesn't break
INSERT INTO public.institutions (id, name, domain, theme_color)
VALUES ('00000000-0000-0000-0000-000000000001', 'Dedan Kimathi University of Technology', 'dkut.ac.ke', '#10b981')
ON CONFLICT DO NOTHING;

-- 2. Inject institution_id into all core tables

-- PROFILES
ALTER TABLE public.profiles ADD COLUMN institution_id UUID REFERENCES public.institutions(id);
UPDATE public.profiles SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;
-- (We will not make it NOT NULL yet because new users signing up might not have it set instantly unless triggered)

-- DOCUMENTS
ALTER TABLE public.documents ADD COLUMN institution_id UUID REFERENCES public.institutions(id);
UPDATE public.documents SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;
ALTER TABLE public.documents ALTER COLUMN institution_id SET NOT NULL;

-- NOTICES
ALTER TABLE public.notices ADD COLUMN institution_id UUID REFERENCES public.institutions(id);
UPDATE public.notices SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;
ALTER TABLE public.notices ALTER COLUMN institution_id SET NOT NULL;

-- TICKETS
ALTER TABLE public.tickets ADD COLUMN institution_id UUID REFERENCES public.institutions(id);
UPDATE public.tickets SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;
ALTER TABLE public.tickets ALTER COLUMN institution_id SET NOT NULL;

-- CALENDAR EVENTS
ALTER TABLE public.calendar_events ADD COLUMN institution_id UUID REFERENCES public.institutions(id);
UPDATE public.calendar_events SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;
ALTER TABLE public.calendar_events ALTER COLUMN institution_id SET NOT NULL;

-- DEPARTMENTS
ALTER TABLE public.departments ADD COLUMN institution_id UUID REFERENCES public.institutions(id);
UPDATE public.departments SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;
ALTER TABLE public.departments ALTER COLUMN institution_id SET NOT NULL;

-- 3. Tenant Isolation RLS Policies

-- For profiles, users can only see profiles in their own institution
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Tenant Isolation: Profiles" ON profiles FOR SELECT USING (
  institution_id = (SELECT institution_id FROM profiles p2 WHERE p2.id = auth.uid()) OR auth.uid() = id
);

-- For documents, restrict to institution
DROP POLICY IF EXISTS "Active documents are viewable by everyone." ON documents;
CREATE POLICY "Tenant Isolation: Documents" ON documents FOR SELECT USING (
  institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
);

-- For notices
DROP POLICY IF EXISTS "Notices are viewable by everyone." ON notices;
CREATE POLICY "Tenant Isolation: Notices" ON notices FOR SELECT USING (
  institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
);

-- For calendar_events
DROP POLICY IF EXISTS "Events are viewable by everyone." ON calendar_events;
CREATE POLICY "Tenant Isolation: Events" ON calendar_events FOR SELECT USING (
  institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
);

-- For tickets
DROP POLICY IF EXISTS "Users can view own tickets or admins can view all." ON tickets;
CREATE POLICY "Tenant Isolation: Tickets" ON tickets FOR SELECT USING (
  institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid()) 
  AND (
      created_by = auth.uid() 
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  )
);
