-- daily_calm_schema.sql

create extension if not exists pgcrypto;

-- =========================
-- archetypes
-- =========================
create table if not exists public.dc_archetypes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                -- sun, moon, mars, mercury, jupiter, venus, saturn, uranus, neptune
  name text not null,
  number_value integer not null,
  weekday_name text,                        -- sunday... saturday, nullable for uranus/neptune
  weekday_order integer,                    -- 0=sun ... 6=sat, nullable for uranus/neptune
  summary text,
  positive_traits text[] not null default '{}',
  shadow_traits text[] not null default '{}',
  health_focus text[] not null default '{}',
  emotional_tendency text,
  created_at timestamptz not null default now()
);

-- =========================
-- moon rules
-- =========================
create table if not exists public.dc_moon_rules (
  id uuid primary key default gen_random_uuid(),
  phase_code text not null unique,          -- waxing, waning
  name text not null,
  summary text,
  themes text[] not null default '{}',
  emotional_effect text,
  created_at timestamptz not null default now()
);

-- =========================
-- general rules
-- =========================
create table if not exists public.dc_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  rule_group text not null,                 -- daily_number, yearly_cycle, interpretation, special_case
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- technique library
-- =========================
create table if not exists public.dc_library (
  id uuid primary key default gen_random_uuid(),
  library_id text not null unique,          -- BR01, JR01, CM01, MD01, MV01
  category text not null check (category in ('breathwork','journaling','communication','meditation','movement')),
  technique text not null unique,
  short_name text not null,
  description text,
  best_for text[] not null default '{}',
  moon_preference text check (moon_preference in ('waxing','waning','either')),
  archetype_fit text[] not null default '{}',
  health_focus text[] not null default '{}',
  emotional_focus text[] not null default '{}',
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================
-- calendar entries
-- =========================
create table if not exists public.dc_calendar_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null unique,
  month_label text not null,                -- 2026-04
  day_energy_code text not null references public.dc_archetypes(code),
  thread_number integer not null check (thread_number between 1 and 9),
  moon_phase_code text not null references public.dc_moon_rules(phase_code),
  library_id text not null references public.dc_library(library_id),
  title text not null,
  goal text not null,
  hashtags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_dc_calendar_entries_month_label
  on public.dc_calendar_entries(month_label);

create index if not exists idx_dc_calendar_entries_day_energy
  on public.dc_calendar_entries(day_energy_code);

create index if not exists idx_dc_library_category
  on public.dc_library(category);

create index if not exists idx_dc_rules_group
  on public.dc_rules(rule_group);