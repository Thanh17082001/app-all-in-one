-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

-- Extensions
create extension if not exists "pgcrypto";

-- Roles
create table if not exists public.roles (
  id bigint generated always as identity primary key,
  uuid uuid not null default gen_random_uuid() unique,
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Profile (links Supabase Auth user → app role)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  role_id bigint references public.roles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists roles_updated_at on public.roles;
create trigger roles_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role_id bigint;
begin
  select id into default_role_id from public.roles where name = 'user' limit 1;

  insert into public.profiles (id, username, email, role_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    default_role_id
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Login by username: resolve email (anon can call)
create or replace function public.get_login_email(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.profiles where username = p_username limit 1;
$$;

grant execute on function public.get_login_email(text) to anon, authenticated;

-- RLS
alter table public.roles enable row level security;
alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid() and r.name = 'admin'
  );
$$;

-- Policies (drop trước để chạy lại migration không lỗi 42710)
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "roles_admin" on public.roles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "roles_admin" on public.roles
  for select using (true); -- Cho phép mọi người xem danh sách Role (an toàn)

-- Seed (idempotent)
insert into public.roles (name, description)
values
  ('admin', 'Quản trị viên - Toàn quyền'),
  ('moderator', 'Quản lý'),
  ('user', 'Người dùng')
on conflict (name) do nothing;
