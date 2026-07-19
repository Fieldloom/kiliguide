-- RUN THIS SCRIPT FIRST
-- We must add these enum values in their own transaction before using them in functions.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'visitor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dept_admin';
