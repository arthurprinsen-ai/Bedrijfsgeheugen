-- Instagram media reserve replay baseline.
-- Canonicalize the exact production table that existed outside migration history.
create table if not exists public.powerhouse_instagram_media_reserve_v1 (
  reserve_id text primary key,
  media_url text not null,
  exact_media_sha256 text not null
    check (exact_media_sha256 ~ '^[0-9a-f]{64}$'::text),
  media_type text not null default 'image'::text,
  media_source text not null default 'placid'::text,
  template_uuid text not null,
  phrase text not null,
  identity_class text not null default 'mira_daily_life'::text,
  identity_contract text not null default 'mira-daily-life-fallback-card-v1'::text,
  identity_gate_result text not null default 'PASS'::text
    check (identity_gate_result = 'PASS'::text),
  evidence_refs jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_instagram_media_reserve_v1 enable row level security;
revoke all on table public.powerhouse_instagram_media_reserve_v1 from public, anon, authenticated;
grant select, insert, update, delete, truncate, references, trigger
on table public.powerhouse_instagram_media_reserve_v1
to service_role;
