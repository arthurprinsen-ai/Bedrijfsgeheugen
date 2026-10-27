create table if not exists public.powerhouse_media_proof_evidence_v1 (
  fingerprint text primary key,
  publication_date date not null,
  channel text not null,
  provider text not null,
  provider_post_id text not null,
  provider_external_url text,
  media_url text not null,
  provider_status text not null,
  canonical_copy text,
  exact_copy_verified boolean not null default false,
  exact_media_retrievable boolean not null default false,
  exact_media_sha256 text,
  exact_media_verified_at timestamptz,
  identity_contract text not null,
  identity_gate_result text not null check (identity_gate_result in ('PASS','FAIL','UNPROVEN')),
  proof_lineage jsonb not null default '{}'::jsonb,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(publication_date, channel, provider_post_id)
);
comment on table public.powerhouse_media_proof_evidence_v1 is 'Canonical exact-final-media proof lineage. Provider sent is transport evidence only; identity PASS requires exact final bytes/frames plus exact copy verification. Fail closed when media cannot be retrieved. Never use this table as a queue/calendar.';
create index if not exists powerhouse_media_proof_evidence_v1_lookup on public.powerhouse_media_proof_evidence_v1(publication_date,channel,provider_post_id);
