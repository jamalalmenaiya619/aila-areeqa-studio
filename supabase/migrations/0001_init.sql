-- A'ila Areeqa Studio, Phase 1 database.
-- Paste this whole file into Supabase > SQL Editor > New query, then press Run. Safe to run twice.
-- Row Level Security (RLS: rules that decide who can read or write each row) is ON for every table.

-- ---------- Roles ----------
do $$ begin
  create type public.app_role as enum ('owner', 'partner', 'designer', 'media');
exception when duplicate_object then null; end $$;

-- Who gets the owner role automatically when they first log in. Readable only by the database itself.
create table if not exists public.app_config (
  id boolean primary key default true check (id),
  owner_email text not null
);
alter table public.app_config enable row level security;
insert into public.app_config (owner_email) values ('ailaareeqa@gmail.com')
  on conflict (id) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;

-- Helper used by the rules. "security definer" lets it read user_roles without looping through RLS.
create or replace function public.has_role(r public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = r);
$$;
revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to authenticated;

-- New login -> profile row, and the owner role for the owner's email.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  if lower(new.email) = (select lower(owner_email) from public.app_config limit 1) then
    insert into public.user_roles (user_id, role) values (new.id, 'owner') on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- If the owner already has an account, make sure the profile and role exist.
insert into public.profiles (id, email)
  select id, email from auth.users where lower(email) = (select lower(owner_email) from public.app_config)
  on conflict (id) do nothing;
insert into public.user_roles (user_id, role)
  select id, 'owner' from auth.users where lower(email) = (select lower(owner_email) from public.app_config)
  on conflict do nothing;

drop policy if exists "profiles: read own, owner reads all" on public.profiles;
create policy "profiles: read own, owner reads all" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role('owner'));
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Roles are read-only from the website. They are changed here, in the SQL Editor.
drop policy if exists "roles: read own, owner reads all" on public.user_roles;
create policy "roles: read own, owner reads all" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role('owner'));

-- ---------- Study progress (same shape as the old Study Book: last, lessons{slide,quiz,checks,notes,feedback,best,done}) ----------
create table if not exists public.study_progress (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  state jsonb not null,
  imported_from text,          -- e.g. 'progress-export-2026-11-01.json' for the one-time import
  updated_at timestamptz not null default now()
);
alter table public.study_progress enable row level security;
drop policy if exists "progress: own rows" on public.study_progress;
create policy "progress: own rows" on public.study_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Notes ----------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  body text not null default '',
  tags text[] not null default '{}',
  source jsonb,                -- where it was saved from: {kind: slide|library|intel, ref, label, href}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_created on public.notes (user_id, created_at desc);
alter table public.notes enable row level security;
drop policy if exists "notes: own rows" on public.notes;
create policy "notes: own rows" on public.notes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Weekly check-in ("Go deeper or keep going?"), read by Phase 2 ----------
create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  week_start date not null,
  choice text check (choice in ('deeper', 'keep_going')),
  ideas text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);
alter table public.weekly_checkins enable row level security;
drop policy if exists "checkins: own rows" on public.weekly_checkins;
create policy "checkins: own rows" on public.weekly_checkins for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Answer-check usage (for the 30-an-hour limit) ----------
create table if not exists public.coach_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists coach_usage_user_time on public.coach_usage (user_id, created_at desc);
alter table public.coach_usage enable row level security;
-- Users can add and count their own rows, but never delete them (so the limit can't be reset).
drop policy if exists "coach usage: insert own" on public.coach_usage;
create policy "coach usage: insert own" on public.coach_usage for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "coach usage: read own" on public.coach_usage;
create policy "coach usage: read own" on public.coach_usage for select to authenticated using (user_id = auth.uid());

-- ---------- Keep updated_at fresh ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists touch_progress on public.study_progress;
create trigger touch_progress before update on public.study_progress for each row execute function public.touch_updated_at();
drop trigger if exists touch_notes on public.notes;
create trigger touch_notes before update on public.notes for each row execute function public.touch_updated_at();
drop trigger if exists touch_checkins on public.weekly_checkins;
create trigger touch_checkins before update on public.weekly_checkins for each row execute function public.touch_updated_at();

-- Nothing is readable without a login.
revoke all on all tables in schema public from anon;
