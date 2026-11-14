-- The Nebula — Supabase schema
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- It is safe to run again: every statement is idempotent.

-- ─────────────────────────────────────────────────────────────
-- Profiles: one row per reader, linking an auth user to a Library name.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null unique check (name in ('Ara', 'Chey', 'Chin', 'Kosca', 'Mae', 'Otep')),
  created_at timestamptz not null default now()
);

-- Map a sign-in email (nebula.<name>@example.com) to its Library name.
create or replace function public.library_name_for_email(email text)
returns text
language sql
immutable
as $$
  select n from unnest(array['Ara', 'Chey', 'Chin', 'Kosca', 'Mae', 'Otep']) as n
  where lower(email) = 'nebula.' || lower(n) || '@example.com'
$$;

-- When a reader's auth user is created, give them their profile automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lib text := public.library_name_for_email(new.email);
begin
  if lib is not null then
    insert into public.profiles (id, name) values (new.id, lib)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: profiles for readers created before this script ran.
insert into public.profiles (id, name)
select u.id, public.library_name_for_email(u.email)
from auth.users u
where public.library_name_for_email(u.email) is not null
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- Worlds: each world is a Notion-style page owned by one reader.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  title text not null default '',
  icon text,
  cover_url text,
  properties jsonb not null default '[]'::jsonb,
  content jsonb,
  template text not null default 'blank',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists worlds_owner_updated_idx on public.worlds (owner, updated_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists worlds_touch_updated_at on public.worlds;
create trigger worlds_touch_updated_at
  before update on public.worlds
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Visits: which readers have wandered into which Library ("Wanderers").
-- ─────────────────────────────────────────────────────────────
create table if not exists public.visits (
  library_owner uuid not null references public.profiles (id) on delete cascade,
  visitor uuid not null references public.profiles (id) on delete cascade,
  first_visit timestamptz not null default now(),
  primary key (library_owner, visitor)
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- Signed-in readers can READ every Library (visiting is read-only),
-- but can only WRITE to their own.
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.worlds enable row level security;
alter table public.visits enable row level security;

drop policy if exists "profiles readable by readers" on public.profiles;
create policy "profiles readable by readers" on public.profiles
  for select to authenticated using (true);

drop policy if exists "worlds readable by readers" on public.worlds;
create policy "worlds readable by readers" on public.worlds
  for select to authenticated using (true);

drop policy if exists "owners create worlds" on public.worlds;
create policy "owners create worlds" on public.worlds
  for insert to authenticated with check (owner = (select auth.uid()));

drop policy if exists "owners edit worlds" on public.worlds;
create policy "owners edit worlds" on public.worlds
  for update to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

drop policy if exists "owners delete worlds" on public.worlds;
create policy "owners delete worlds" on public.worlds
  for delete to authenticated using (owner = (select auth.uid()));

drop policy if exists "visits readable by readers" on public.visits;
create policy "visits readable by readers" on public.visits
  for select to authenticated using (true);

drop policy if exists "readers record own visits" on public.visits;
create policy "readers record own visits" on public.visits
  for insert to authenticated
  with check (visitor = (select auth.uid()) and library_owner <> (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- Storage: images for covers and pages. 2 MB max, images only.
-- Files live under <user id>/..., and only the owner can write there.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "readers upload own media" on storage.objects;
create policy "readers upload own media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "readers update own media" on storage.objects;
create policy "readers update own media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "readers delete own media" on storage.objects;
create policy "readers delete own media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
