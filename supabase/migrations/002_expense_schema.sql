-- ============================================================
-- Expense module (bigint id — khớp convention 001 + FE sau này)
-- Chạy SAU 001_initial_schema.sql
-- ============================================================

create table if not exists public.type_expense (
  id bigint generated always as identity primary key,
  uuid uuid not null default gen_random_uuid() unique,
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense (
  id bigint generated always as identity primary key,
  uuid uuid not null default gen_random_uuid() unique,
  title text not null,
  amount numeric(14, 2) not null,
  type_id bigint not null references public.type_expense(id) on delete restrict,
  note text,
  expense_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists type_expense_updated_at on public.type_expense;
create trigger type_expense_updated_at
  before update on public.type_expense
  for each row execute function public.set_updated_at();

drop trigger if exists expense_updated_at on public.expense;
create trigger expense_updated_at
  before update on public.expense
  for each row execute function public.set_updated_at();

alter table public.type_expense enable row level security;
alter table public.expense enable row level security;

create policy "type_expense_admin" on public.type_expense
  for all using (public.is_admin()) with check (public.is_admin());

create policy "expense_admin" on public.expense
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.type_expense (name, description)
values
  ('food', 'Ăn uống'),
  ('shopping', 'Mua sắm'),
  ('transport', 'Di chuyển'),
  ('bills', 'Hóa đơn'),
  ('income', 'Thu nhập')
on conflict (name) do nothing;
