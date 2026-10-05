-- Instagram daily winner replay baseline.
-- The 10:25 publication-authority function references this rowtype before the
-- canonical 11:00 winner-lineage migration creates the table.
-- Create only the exact canonical table shape early; the 11:00 migration remains
-- authoritative for RLS, grants, functions, triggers and comments.
-- Replay prerequisite: powerhouse_content_recommendations existed in production before
-- this historical point but had no deterministic creation in repository replay history.
-- Mirror the exact production table shape idempotently before the winner FK is declared.
create table if not exists public.powerhouse_content_recommendations (
  recommendation_id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  run_date date not null,
  topic_key text not null,
  content_key text,
  target_channel text,
  recommendation_type text not null,
  priority numeric not null default 0,
  reason text not null default '',
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'suggested'
    check (status in ('suggested','accepted','done','skipped','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_content_recommendations enable row level security;
revoke all on table public.powerhouse_content_recommendations from public, anon, authenticated;
grant all on table public.powerhouse_content_recommendations to service_role;

create table if not exists public.powerhouse_instagram_daily_winners_v1 (
  run_date date primary key,
  recommendation_id uuid not null references public.powerhouse_content_recommendations(recommendation_id),
  score_version text not null,
  selected_priority numeric not null,
  selected_format text not null,
  selected_at timestamptz not null default now(),
  selector_evidence jsonb not null default '{}'::jsonb,
  outcome_evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);


alter table public.powerhouse_instagram_daily_winners_v1 enable row level security;
revoke all on table public.powerhouse_instagram_daily_winners_v1 from public, anon, authenticated;
grant select, insert, update on table public.powerhouse_instagram_daily_winners_v1 to service_role;
