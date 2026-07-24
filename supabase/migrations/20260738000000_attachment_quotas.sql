alter table public.profiles add column daily_attachment_count int not null default 0;
alter table public.profiles add column attachment_last_reset timestamp with time zone not null default now();
