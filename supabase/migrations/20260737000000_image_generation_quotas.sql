alter table public.profiles add column image_generation_count int not null default 0;

create table public.app_settings (
  id text primary key,
  image_generation_limit int not null default 5
);

insert into public.app_settings (id, image_generation_limit) values ('global', 5);

-- Enable RLS
alter table public.app_settings enable row level security;

-- Policies for app_settings
create policy "Anyone can view app settings"
  on public.app_settings for select
  using (true);

create policy "Only admins can update app settings"
  on public.app_settings for update
  using (public.is_admin());
