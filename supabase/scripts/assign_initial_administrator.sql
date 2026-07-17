-- Run once in the Supabase SQL Editor after the account has signed up.
-- This grants administrator access to the current KiliGuide project owner.
insert into public.user_roles (user_id, role)
select id, 'administrator'::public.app_role
from auth.users
where lower(email) = lower('griffinwekesa65@gmail.com')
on conflict (user_id, role) do nothing;

select u.email, r.role
from auth.users u
join public.user_roles r on r.user_id = u.id
where lower(u.email) = lower('griffinwekesa65@gmail.com');
