alter table public.scan_inzendingen
  add column if not exists submission_key text,
  add column if not exists schema_version integer not null default 2,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists powerhouse_event_id uuid,
  add column if not exists company_key text,
  add column if not exists bron_url text,
  add column if not exists bijgewerkt_op timestamptz not null default now();

create unique index if not exists scan_inzendingen_submission_key_uq on public.scan_inzendingen(submission_key) where submission_key is not null;
create index if not exists scan_inzendingen_org_date_idx on public.scan_inzendingen(organisatie_id, scan_datum desc, aangemaakt desc) where organisatie_id is not null;

comment on column public.scan_inzendingen.submission_key is 'Stable idempotency key shared by website, portal and Powerhouse ingestion.';
comment on column public.scan_inzendingen.schema_version is 'Canonical scan contract version. Legacy rows remain valid and are projected through compatibility logic.';
comment on column public.scan_inzendingen.payload is 'Lossless canonical scan payload including dimensions, answers and provenance. Never use as identity authority.';
comment on column public.scan_inzendingen.powerhouse_event_id is 'Reference to the canonical Powerhouse runtime event emitted for this scan.';
comment on column public.scan_inzendingen.company_key is 'Powerhouse company key only when identity is verified; NULL for anonymous/unverified scans.';
comment on column public.scan_inzendingen.bron_url is 'Canonical source URL for provenance.';

create or replace view public.powerhouse_scan_history_v1 as
select s.id scan_id,s.submission_key,s.schema_version,s.organisatie_id,s.klant_slug,s.company_key,s.tenant_identity_status,s.soort,s.bron,s.bron_url,s.scan_datum,s.aangemaakt,s.bijgewerkt_op,s.score,
 lag(s.score) over (partition by coalesce(s.organisatie_id::text,s.klant_slug,s.company_key,'unverified') order by coalesce(s.scan_datum,s.aangemaakt::date),s.aangemaakt) vorige_score,
 case when lag(s.score) over (partition by coalesce(s.organisatie_id::text,s.klant_slug,s.company_key,'unverified') order by coalesce(s.scan_datum,s.aangemaakt::date),s.aangemaakt) is null then null else s.score-lag(s.score) over (partition by coalesce(s.organisatie_id::text,s.klant_slug,s.company_key,'unverified') order by coalesce(s.scan_datum,s.aangemaakt::date),s.aangemaakt) end score_delta,
 s.branche,s.omvang,s.niveaus,s.taken,s.doel,s.payload,s.powerhouse_event_id
from public.scan_inzendingen s;
alter view public.powerhouse_scan_history_v1 set (security_invoker = true);
revoke all on table public.powerhouse_scan_history_v1 from public, anon, authenticated;
grant select on table public.powerhouse_scan_history_v1 to service_role;
comment on view public.powerhouse_scan_history_v1 is 'Canonical compatibility projection for legacy and current scans. Identity status remains explicit; unverified scans must not be promoted to account-level learning.';
