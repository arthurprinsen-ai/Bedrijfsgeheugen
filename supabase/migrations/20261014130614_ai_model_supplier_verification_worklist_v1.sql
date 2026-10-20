create table if not exists public.ai_model_supplier_verification_v1 (
 model_id text primary key,
 provider text not null,
 source_url text not null,
 declared_status text,
 catalog_version text not null,
 catalog_record jsonb not null,
 verification_status text not null default 'UNVERIFIED' check (verification_status in ('UNVERIFIED','STALE','PARTIAL','VERIFIED','CONFLICT')),
 required_claims jsonb not null default '["model_id","status","pricing","capabilities","deployment","governance"]'::jsonb,
 claim_evidence jsonb not null default '[]'::jsonb,
 updated_at timestamptz not null default now(),
 constraint supplier_url_https check (source_url like 'https://%')
);
alter table public.ai_model_supplier_verification_v1 enable row level security;
revoke all on public.ai_model_supplier_verification_v1 from anon, authenticated;
comment on table public.ai_model_supplier_verification_v1 is 'Supplier model evidence worklist; NOT verified supplier facts. Customer-specific contract and configuration attestations are separate.';
