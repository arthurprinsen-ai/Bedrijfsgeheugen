-- Instagram daily winner replay baseline.
-- The 10:25 publication-authority function references this rowtype before the
-- canonical 11:00 winner-lineage migration creates the table.
-- Create only the exact canonical table shape early; the 11:00 migration remains
-- authoritative for RLS, grants, functions, triggers and comments.
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
