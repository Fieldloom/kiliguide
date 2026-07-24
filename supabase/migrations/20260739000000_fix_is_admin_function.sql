-- Fix is_admin to also allow super_admin
create or replace function public.is_admin() returns boolean language sql stable security definer as $$
  select exists(
    select 1 from public.user_roles 
    where user_id=auth.uid() and role in ('administrator', 'super_admin')
  )
$$;
