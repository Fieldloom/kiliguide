alter table public.user_roles enable row level security;
alter table public.departments enable row level security;
create policy "users read own roles" on public.user_roles for select to authenticated using(user_id=auth.uid());
create policy "admins manage roles" on public.user_roles for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "authenticated read departments" on public.departments for select to authenticated using(true);
create policy "admins manage departments" on public.departments for all to authenticated using(public.is_admin()) with check(public.is_admin());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, full_name, preferred_language) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), coalesce(new.raw_user_meta_data->>'preferred_language', 'en')) on conflict(id) do nothing;
  insert into public.user_roles(user_id, role) values (new.id, 'student') on conflict(user_id,role) do nothing;
  insert into public.notification_preferences(user_id) values (new.id) on conflict(user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.primary_role() returns public.app_role language sql stable security definer set search_path=public as $$
  select role from public.user_roles where user_id=auth.uid() order by case role when 'administrator' then 1 when 'department' then 2 when 'lecturer' then 3 else 4 end limit 1
$$;
revoke all on function public.primary_role() from public;
grant execute on function public.primary_role() to authenticated;
