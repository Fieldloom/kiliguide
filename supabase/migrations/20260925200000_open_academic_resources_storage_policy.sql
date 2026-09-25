-- Migration: Storage Bucket & Open Access Policies for Academic Resources
-- Ensures uploaded course materials, lecture notes, and past papers are publicly accessible to all students.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('academic_resources', 'academic_resources', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read academic resources bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated write academic resources bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update academic resources bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete academic resources bucket" ON storage.objects;

CREATE POLICY "Public read academic resources bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'academic_resources');

CREATE POLICY "Authenticated write academic resources bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'academic_resources');

CREATE POLICY "Authenticated update academic resources bucket" ON storage.objects
FOR UPDATE WITH CHECK (bucket_id = 'academic_resources');

CREATE POLICY "Authenticated delete academic resources bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'academic_resources');
