create table public.trusted_source_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique check (domain = lower(domain)),
  organisation text not null,
  approved boolean not null default true,
  notes text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents add column if not exists source_url text;
alter table public.documents add column if not exists processing_status text not null default 'uploaded' check (processing_status in ('uploaded','extracting','chunking','embedding','ready','failed','archived'));
alter table public.documents add column if not exists processing_error text;
alter table public.documents add column if not exists processed_at timestamptz;
alter table public.documents add column if not exists chunk_count integer not null default 0;
alter table public.documents add column if not exists content_checksum text;

create index documents_processing_status_idx on public.documents(processing_status, created_at desc);
alter table public.trusted_source_domains enable row level security;
create policy "trusted sources authenticated read" on public.trusted_source_domains for select to authenticated using(approved or public.is_admin());
create policy "administrators manage trusted sources" on public.trusted_source_domains for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "administrators delete document files" on storage.objects for delete to authenticated using(bucket_id = 'documents' and public.is_admin());

insert into public.trusted_source_domains (domain, organisation, notes) values
  ('dkut.ac.ke', 'Dedan Kimathi University of Technology', 'Official university domain'),
  ('kuccps.net', 'Kenya Universities and Colleges Central Placement Service', 'Approved national placement source'),
  ('helb.co.ke', 'Higher Education Loans Board', 'Approved student-finance source'),
  ('cue.or.ke', 'Commission for University Education', 'Approved higher-education regulator'),
  ('kenyalaw.org', 'Kenya Law', 'Approved legal-information source'),
  ('education.go.ke', 'Ministry of Education, Kenya', 'Approved government source')
on conflict (domain) do nothing;
