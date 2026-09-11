alter table public.bg_post_kenmerken
  add column if not exists persona text,
  add column if not exists pain_trigger text,
  add column if not exists fomo_trigger text,
  add column if not exists comedy_device text,
  add column if not exists proof_type text,
  add column if not exists offer_type text,
  add column if not exists source_signal text,
  add column if not exists commercial_hypothesis text,
  add column if not exists experiment_id text,
  add column if not exists objective text;

alter table public.social_experiments
  add column if not exists recipe jsonb not null default '{}'::jsonb,
  add column if not exists source_signals jsonb not null default '[]'::jsonb,
  add column if not exists commercial_hypothesis text,
  add column if not exists target_channels jsonb not null default '[]'::jsonb,
  add column if not exists calendar_date date;

create index if not exists social_experiments_status_started_idx
  on public.social_experiments(status, started_at desc);
create index if not exists social_experiments_calendar_date_idx
  on public.social_experiments(calendar_date);
create index if not exists bg_post_kenmerken_experiment_idx
  on public.bg_post_kenmerken(experiment_id);
