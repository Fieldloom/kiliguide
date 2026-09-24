-- Migration: Merge duplicate "Dedan Kimathi University" into "Dedan Kimathi University of Technology"
-- Unifies knowledge base, profiles, documents, notices, tickets, and departments under a single canonical institution tenant.

DO $$
DECLARE
  v_main_id UUID := '00000000-0000-0000-0000-000000000001';
  v_dup_record RECORD;
BEGIN
  -- 1. Ensure primary canonical institution exists with official full name
  INSERT INTO public.institutions (id, name, domain, theme_color, status)
  VALUES (v_main_id, 'Dedan Kimathi University of Technology', 'dkut.ac.ke', '#10b981', 'active')
  ON CONFLICT (id) DO UPDATE 
  SET name = 'Dedan Kimathi University of Technology',
      domain = 'dkut.ac.ke',
      status = 'active';

  -- 2. Loop over any duplicate institution records named 'Dedan Kimathi University' or with student domain variations
  FOR v_dup_record IN 
    SELECT id FROM public.institutions 
    WHERE (name ILIKE 'Dedan Kimathi University' AND name NOT ILIKE '%Technology%')
       OR id = '890de192-8e9c-47e8-afbd-720065874748'
       OR domain ILIKE '%students.dkut.ac.ke%'
  LOOP
    IF v_dup_record.id <> v_main_id THEN
      -- Re-link profiles
      UPDATE public.profiles 
      SET institution_id = v_main_id 
      WHERE institution_id = v_dup_record.id;

      -- Re-link documents
      UPDATE public.documents 
      SET institution_id = v_main_id 
      WHERE institution_id = v_dup_record.id;

      -- Re-link notices
      UPDATE public.notices 
      SET institution_id = v_main_id 
      WHERE institution_id = v_dup_record.id;

      -- Re-link tickets
      UPDATE public.tickets 
      SET institution_id = v_main_id 
      WHERE institution_id = v_dup_record.id;

      -- Re-link calendar events
      UPDATE public.calendar_events 
      SET institution_id = v_main_id 
      WHERE institution_id = v_dup_record.id;

      -- Re-link departments
      UPDATE public.departments 
      SET institution_id = v_main_id 
      WHERE institution_id = v_dup_record.id;

      -- Remove duplicate institution record
      DELETE FROM public.institutions WHERE id = v_dup_record.id;
    END IF;
  END LOOP;

END $$;
