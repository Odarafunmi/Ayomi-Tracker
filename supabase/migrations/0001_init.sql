-- Ayomi Tracker — initial schema
-- One table set: profiles, cycles. Row Level Security ensures every user can
-- only ever access their own data.

-- ── profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  name                   text,
  email                  text,
  average_cycle_length   smallint not null default 28 check (average_cycle_length between 15 and 60),
  average_period_length  smallint not null default 5  check (average_period_length between 1 and 14),
  consent_health_data    boolean  not null default false,
  consent_reminder_emails boolean not null default false,
  consented_at           timestamptz,
  remind_period          boolean  not null default true,
  remind_ovulation       boolean  not null default true,
  remind_phase_change    boolean  not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ── cycles ───────────────────────────────────────────────────────────────────
create table if not exists public.cycles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date   date,
  created_at timestamptz not null default now(),
  constraint cycles_end_after_start check (end_date is null or end_date >= start_date)
);

create index if not exists cycles_user_start_idx on public.cycles (user_id, start_date);

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.cycles   enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

create policy "cycles_select_own" on public.cycles
  for select using (auth.uid() = user_id);
create policy "cycles_insert_own" on public.cycles
  for insert with check (auth.uid() = user_id);
create policy "cycles_update_own" on public.cycles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cycles_delete_own" on public.cycles
  for delete using (auth.uid() = user_id);
