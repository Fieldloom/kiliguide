alter table public.profiles add column if not exists registration_number text unique;
alter table public.profiles add column if not exists school text;
alter table public.profiles add column if not exists sponsorship_category text check(sponsorship_category in ('kuccps','self_sponsored','postgraduate','international'));
alter table public.profiles add column if not exists onboarding_complete boolean not null default false;
insert into public.departments (name, email) values
  ('Registrar Academic Affairs & Research', 'registrar@dkut.ac.ke'),
  ('Admissions Office', 'admissionsoffice@dkut.ac.ke'),
  ('Finance Office', null),
  ('ICT / Student Portal Support', null),
  ('Accommodation', null),
  ('Student Welfare', null),
  ('Data Protection Office', 'dataprotection@dkut.ac.ke'),
  ('School of Engineering', 'admin_soe@dkut.ac.ke'),
  ('School of Science', null)
on conflict (name) do update set email=excluded.email;
