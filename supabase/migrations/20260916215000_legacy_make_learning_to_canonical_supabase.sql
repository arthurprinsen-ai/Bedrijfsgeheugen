-- Legacy Make learning/writeback retirement.
-- Preserve fingerprints and historical evidence while making Supabase/Powerhouse
-- the verification authority. No Make/BG168/BG166/BG167 execution is required.

alter table public.powerhouse_knowledge_replay_spool
  add column if not exists canonical_authority text,
  add column if not exists canonical_ref text,
  add column if not exists legacy_route text,
  add column if not exists migrated_at timestamptz;

alter table public.powerhouse_knowledge_replay_spool
  drop constraint if exists powerhouse_knowledge_replay_verified_requires_readback;

alter table public.powerhouse_knowledge_replay_spool
  add constraint powerhouse_knowledge_replay_verified_requires_readback
  check (
    state <> 'VERIFIED'
    or (
      verified_at is not null
      and (
        bg167_ref is not null
        or (canonical_authority is not null and canonical_ref is not null)
      )
    )
  );

create temporary table _legacy_make_learning_migration (
  fingerprint text primary key,
  issue_number integer,
  learning_kind text not null
) on commit drop;

insert into _legacy_make_learning_migration(fingerprint, issue_number, learning_kind) values
  ('website-painted-cockpit-wrapper-blindspot-v1', 1120, 'escaped-defect-learning'),
  ('connector-ai-wizard-powerhouse-closed-loop-v1', 1153, 'connector-closed-loop-learning'),
  ('learning-plane|make-paused-writeback-deferred|2026-08-31-v1', 813, 'deferred-learning-obligation'),
  ('chat-learning|2026-08-31|cost-delivery-closure-v1', 813, 'cost-delivery-learning'),
  ('mission-control|cache-promotion|shadow-loop-severed-v1', 741, 'mission-control-root-cause'),
  ('organization-team-runtime-authority-v1', 741, 'runtime-authority-guard'),
  ('stable-scenario-identity-v1', 741, 'identity-guard'),
  ('quota-recovery-no-blind-resume-v1', 741, 'capacity-recovery-guard'),
  ('read-cost-frequency-times-payload-v1', 741, 'finops-guard')
on conflict (fingerprint) do nothing;

insert into public.brain_obligations (
  obligation_type,
  capability_id,
  business_entity,
  business_period,
  business_timezone,
  payload_sha256,
  change_id,
  owner,
  state,
  evidence
)
select
  'LEGACY_LEARNING_MIGRATION',
  'canonical-learning-writeback-v1',
  m.fingerprint,
  'historical',
  'Europe/Amsterdam',
  encode(digest(convert_to(m.fingerprint || '|canonical-supabase-v1', 'UTF8'), 'sha256'), 'hex'),
  'legacy-make-learning-migration-20260916',
  'Bedrijfsgeheugen Powerhouse',
  'FULFILLED',
  jsonb_build_object(
    'fingerprint', m.fingerprint,
    'legacy_issue', m.issue_number,
    'learning_kind', m.learning_kind,
    'legacy_route', 'Make/BG168/BG166/BG167',
    'legacy_route_status', 'RETIRED_SUPERSEDED',
    'canonical_authority', 'Supabase/Powerhouse brain_obligations',
    'migration', 'preserve fingerprint/evidence; no Make replay',
    'verified_at', now(),
    'rule', 'EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP'
  )
from _legacy_make_learning_migration m
on conflict (obligation_type, capability_id, business_entity, business_period, business_timezone)
do update set
  payload_sha256 = excluded.payload_sha256,
  change_id = excluded.change_id,
  owner = excluded.owner,
  state = 'FULFILLED',
  evidence = public.brain_obligations.evidence || excluded.evidence,
  updated_at = now(),
  version = public.brain_obligations.version + 1;

-- Update any historical spool item that already carries one of these fingerprints.
update public.powerhouse_knowledge_replay_spool s
set
  canonical_authority = 'supabase:brain_obligations',
  canonical_ref = 'brain_obligations:' || m.fingerprint,
  legacy_route = coalesce(s.legacy_route, 'Make/BG168/BG166/BG167'),
  migrated_at = coalesce(s.migrated_at, now()),
  reason = 'LEGACY_MAKE_ROUTE_SUPERSEDED_BY_CANONICAL_SUPABASE',
  state = 'VERIFIED',
  verified_at = coalesce(s.verified_at, now()),
  updated_at = now(),
  event_json = coalesce(s.event_json, '{}'::jsonb) || jsonb_build_object(
    'fingerprint', m.fingerprint,
    'legacy_issue', m.issue_number,
    'legacy_route_status', 'RETIRED_SUPERSEDED',
    'canonical_authority', 'supabase:brain_obligations',
    'canonical_ref', 'brain_obligations:' || m.fingerprint,
    'closure_rule', 'Canonical Supabase persistence + readback is authoritative; do not reactivate Make.',
    'migrated_at', now()
  )
from _legacy_make_learning_migration m
where s.fingerprint = m.fingerprint;

-- Create a durable spool/readback row for listed fingerprints that were never
-- successfully copied into the old Make queue.
insert into public.powerhouse_knowledge_replay_spool (
  dedupe_key,
  event_id,
  fingerprint,
  event_json,
  reason,
  state,
  attempt_count,
  canonical_authority,
  canonical_ref,
  legacy_route,
  migrated_at,
  verified_at
)
select
  'legacy-make-migration:' || m.fingerprint,
  'legacy-make-migration:' || m.issue_number::text || ':' || m.learning_kind,
  m.fingerprint,
  jsonb_build_object(
    'schema_version', 'powerhouse.knowledge-event.v1',
    'source_type', 'github-legacy-obligation',
    'legacy_issue', m.issue_number,
    'fingerprint', m.fingerprint,
    'learning_kind', m.learning_kind,
    'legacy_route', 'Make/BG168/BG166/BG167',
    'legacy_route_status', 'RETIRED_SUPERSEDED',
    'canonical_authority', 'supabase:brain_obligations',
    'canonical_ref', 'brain_obligations:' || m.fingerprint,
    'outcome', jsonb_build_object('status', 'migrated', 'summary', 'Legacy Make writeback obligation migrated to canonical Supabase/Powerhouse authority.'),
    'closure_rule', 'Canonical Supabase persistence + readback is authoritative; do not reactivate Make.',
    'migrated_at', now()
  ),
  'LEGACY_MAKE_ROUTE_SUPERSEDED_BY_CANONICAL_SUPABASE',
  'VERIFIED',
  0,
  'supabase:brain_obligations',
  'brain_obligations:' || m.fingerprint,
  'Make/BG168/BG166/BG167',
  now(),
  now()
from _legacy_make_learning_migration m
where not exists (
  select 1 from public.powerhouse_knowledge_replay_spool s where s.fingerprint = m.fingerprint
)
on conflict (dedupe_key) do nothing;

comment on column public.powerhouse_knowledge_replay_spool.canonical_authority is
  'Current verification authority. Legacy BG references remain historical evidence only after Make retirement.';
comment on column public.powerhouse_knowledge_replay_spool.canonical_ref is
  'Readback reference in the current canonical authority; required with verified_at when no legacy BG167 ref exists.';
