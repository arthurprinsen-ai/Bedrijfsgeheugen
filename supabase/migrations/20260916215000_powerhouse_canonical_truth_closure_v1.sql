-- Powerhouse canonical truth closure v1
-- Reuses brain_obligations and brain_blockers; does not create a parallel state authority.

create or replace view public.powerhouse_material_claims_v1
with (security_invoker = true)
as
with obligation_claims as (
  select
    'obligation'::text as record_kind,
    o.id::text as record_id,
    o.capability_id as subject_id,
    o.state,
    coalesce(
      nullif(o.evidence #>> '{truth_reconciliation,classification}', ''),
      case
        when o.state = 'FULFILLED' then 'PROVEN_FIXED'
        when o.state = 'CANCELLED' then 'SUPERSEDED'
        else 'EVIDENCE_MISSING'
      end
    ) as classification,
    o.updated_at as source_updated_at,
    o.evidence
  from public.brain_obligations o
), blocker_claims as (
  select
    'blocker'::text as record_kind,
    b.id::text as record_id,
    concat(b.fingerprint, '|', b.scope) as subject_id,
    b.state,
    coalesce(
      nullif(b.resolution_evidence #>> '{truth_reconciliation,classification}', ''),
      nullif(b.last_evidence #>> '{truth_reconciliation,classification}', ''),
      case
        when b.state = 'RESOLVED' then 'PROVEN_FIXED'
        else 'EVIDENCE_MISSING'
      end
    ) as classification,
    b.updated_at as source_updated_at,
    jsonb_build_object(
      'last_evidence', coalesce(b.last_evidence, '{}'::jsonb),
      'resolution_evidence', coalesce(b.resolution_evidence, '{}'::jsonb)
    ) as evidence
  from public.brain_blockers b
), claims as (
  select * from obligation_claims
  union all
  select * from blocker_claims
)
select
  record_kind,
  record_id,
  subject_id,
  state,
  classification,
  classification in ('CURRENT_DEFECT', 'CURRENT_EXTERNAL_BOUNDARY', 'EVIDENCE_MISSING')
    and state not in ('FULFILLED', 'CANCELLED', 'RESOLVED') as material,
  source_updated_at,
  evidence
from claims;

revoke all on public.powerhouse_material_claims_v1 from public;
revoke all on public.powerhouse_material_claims_v1 from anon;
revoke all on public.powerhouse_material_claims_v1 from authenticated;
grant select on public.powerhouse_material_claims_v1 to service_role;

comment on view public.powerhouse_material_claims_v1 is
  'Canonical read model for current Powerhouse obligation/blocker materiality. Classification is evidence-backed; unclassified non-terminal claims fail closed as EVIDENCE_MISSING. Fingerprint powerhouse-canonical-truth-closure-v1.';
