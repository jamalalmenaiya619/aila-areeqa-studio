-- Run after supabase-stub.sql and 0001_init.sql. Any failed check raises an error.
\set ON_ERROR_STOP on
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'AilaAreeqa@gmail.com'), ('00000000-0000-0000-0000-00000000000b', 'someone@example.com');
do $$ begin
  assert (select count(*) from public.user_roles where role = 'owner') = 1, 'owner role not assigned exactly once';
  assert (select count(*) from public.profiles) = 2, 'profiles not created';
end $$;
-- user A writes own rows
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
insert into public.study_progress (state) values ('{"last":"l5","lessons":{}}');
insert into public.notes (body) values ('A note');
insert into public.coach_usage default values;
insert into public.weekly_checkins (week_start, choice, ideas) values ('2026-11-01', 'deeper', 'more on sadu');
do $$ begin assert public.has_role('owner'), 'A should be owner'; assert (select count(*) from public.profiles) = 2, 'owner should read all profiles'; end $$;
-- user B sees none of A's rows and cannot write as A
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin
  assert (select count(*) from public.study_progress) = 0, 'B can read A progress';
  assert (select count(*) from public.notes) = 0, 'B can read A notes';
  assert (select count(*) from public.coach_usage) = 0, 'B can read A usage';
  assert (select count(*) from public.weekly_checkins) = 0, 'B can read A checkins';
  assert (select count(*) from public.profiles) = 1, 'B can read other profiles';
  assert (select count(*) from public.app_config) = 0, 'B can read app_config';
  assert not public.has_role('owner'), 'B is owner';
end $$;
do $$ begin
  begin insert into public.notes (user_id, body) values ('00000000-0000-0000-0000-00000000000a', 'x'); raise exception 'B wrote a note as A';
  exception when insufficient_privilege then null; end;
  begin insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000b', 'owner'); raise exception 'B made itself owner';
  exception when insufficient_privilege then null; end;
end $$;
update public.notes set body = 'hacked'; -- affects 0 rows under RLS
-- A cannot delete usage rows
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
delete from public.coach_usage;
do $$ begin
  assert (select count(*) from public.coach_usage) = 1, 'A could delete usage rows';
  assert (select body from public.notes limit 1) = 'A note', 'B changed A note';
end $$;
-- anonymous: nothing
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  begin perform count(*) from public.notes; raise exception 'anon can read notes'; exception when insufficient_privilege then null; end;
end $$;
reset role;
-- every public table has RLS on
do $$ begin assert (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity) = 0, 'a table has RLS off'; end $$;
select 'RLS TESTS PASSED' as result;
