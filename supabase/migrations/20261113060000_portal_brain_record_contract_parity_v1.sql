-- P0 #4215: original Portal BusinessInput -> original Brain authority type/kind parity.
-- The existing authenticated /api/portal-business-input writer already emits
-- SourceObservation/raw_source, BusinessInput/SourceTruth,
-- CurrentState/current_state and ImpactAssessment/organism_impact.
-- Prior production CHECK constraints rejected three of these four record pairs
-- before any real consumer processing could occur.
-- Preserve existing canonical values, tenant-scoped PK/idempotency, RLS and
-- service-role-only write authority. This adds no writer, table, policy or grant.

begin;

alter table public.brain_records
  drop constraint brain_records_type_check;

alter table public.brain_records
  add constraint brain_records_type_check
  check (record_type in (
    'Evidence','Signal','Opportunity','Impact','Decision','Action',
    'Execution','Verification','Outcome','Value','Learning','Memory',
    'Entity','Relation','CurrentState','Governance',
    'SourceObservation','BusinessInput','ImpactAssessment'
  )) not valid;

alter table public.brain_records
  drop constraint brain_records_kind_check;

alter table public.brain_records
  add constraint brain_records_kind_check
  check (record_kind in (
    'evidence','signal','opportunity','impact','decision','action',
    'execution','verification','outcome','value','learning','memory',
    'entity','relation','current_state','governance',
    'raw_source','SourceTruth','organism_impact'
  )) not valid;

-- Validate against the actual existing rows, rather than claiming parity
-- from a source fixture. A failure rolls the entire transaction back.
alter table public.brain_records validate constraint brain_records_type_check;
alter table public.brain_records validate constraint brain_records_kind_check;

comment on constraint brain_records_type_check on public.brain_records is
  'Canonical Brain record types plus the existing authenticated Portal SourceObservation, BusinessInput and ImpactAssessment lineage; P0 #4215';
comment on constraint brain_records_kind_check on public.brain_records is
  'Canonical Brain record kinds plus the existing Portal raw_source, SourceTruth and organism_impact lineage; P0 #4215';

commit;
