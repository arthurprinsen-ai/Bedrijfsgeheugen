-- Connect the canonical sovereignty impact ledger to existing Brain obligations.
-- The immutable event stays the authority. OPEN is a review request, not a verdict.
-- No extra scheduler, provider executor, or shadow learning store is created.
create or replace function public.powerhouse_sovereignty_impact_obligation_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.assessment->>'contract' is distinct from 'powerhouse-cross-domain-change-v1'
     or new.assessment->>'status' is distinct from 'REVIEW_REQUIRED'
     or new.assessment->>'tenantId' is distinct from new.tenant_id
     or new.assessment->>'changeId' is distinct from new.change_id
     or new.assessment->>'deploymentApproved' is distinct from 'false'
     or coalesce(jsonb_typeof(new.assessment->'affectedDomains'),'') <> 'array'
     or coalesce(jsonb_typeof(new.assessment->'esrsReview'),'') <> 'array'
  then
    raise exception 'INVALID_SOVEREIGNTY_BRAIN_OBLIGATION' using errcode='22023';
  end if;

  insert into public.brain_obligations(
    obligation_type,capability_id,business_entity,business_period,business_timezone,
    payload_sha256,change_id,owner,state,evidence
  ) values (
    'CROSS_DOMAIN_REVIEW',
    'powerhouse-cross-domain-impact-v1',
    'tenant:'||new.tenant_id||':policy-v'||new.policy_version::text,
    (new.recorded_at at time zone 'Europe/Amsterdam')::date::text,
    'Europe/Amsterdam',
    encode(sha256(convert_to(new.assessment::text,'UTF8')),'hex'),
    new.change_id,
    'TENANT_GOVERNANCE',
    'OPEN',
    jsonb_build_object(
      'contract','powerhouse-cross-domain-review-obligation-v1',
      'tenant_id',new.tenant_id,
      'change_id',new.change_id,
      'policy_version',new.policy_version,
      'source','tenant_data_sovereignty_change_impact_v1',
      'affected_domains',new.assessment->'affectedDomains',
      'esrs_review',new.assessment->'esrsReview',
      'applicability','UNDETERMINED',
      'measured_environmental_impact',null,
      'review_outcome','PENDING_EVIDENCE',
      'next_action','REVIEW_WITH_TENANT_AUTHORITY_AND_INDEPENDENT_EVIDENCE',
      'runtime_activation_authorized',false
    )
  )
  on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone)
  do nothing;

  return new;
end
$$;
revoke all on function public.powerhouse_sovereignty_impact_obligation_v1() from public, anon, authenticated;

drop trigger if exists powerhouse_sovereignty_impact_obligation_v1 on public.tenant_data_sovereignty_change_impact_v1;
create trigger powerhouse_sovereignty_impact_obligation_v1
after insert on public.tenant_data_sovereignty_change_impact_v1
for each row execute function public.powerhouse_sovereignty_impact_obligation_v1();

-- Replay historical events into the same canonical obligations, without touching
-- existing records and without fabricating a review completion.
insert into public.brain_obligations(
 obligation_type,capability_id,business_entity,business_period,business_timezone,
 payload_sha256,change_id,owner,state,evidence
)
select
 'CROSS_DOMAIN_REVIEW',
 'powerhouse-cross-domain-impact-v1',
 'tenant:'||i.tenant_id||':policy-v'||i.policy_version::text,
 (i.recorded_at at time zone 'Europe/Amsterdam')::date::text,
 'Europe/Amsterdam',
 encode(sha256(convert_to(i.assessment::text,'UTF8')),'hex'),
 i.change_id,'TENANT_GOVERNANCE','OPEN',
 jsonb_build_object(
  'contract','powerhouse-cross-domain-review-obligation-v1',
  'tenant_id',i.tenant_id,'change_id',i.change_id,
  'policy_version',i.policy_version,
  'source','tenant_data_sovereignty_change_impact_v1',
  'affected_domains',i.assessment->'affectedDomains',
  'esrs_review',i.assessment->'esrsReview',
  'applicability','UNDETERMINED',
  'measured_environmental_impact',null,
  'review_outcome','PENDING_EVIDENCE',
  'next_action','REVIEW_WITH_TENANT_AUTHORITY_AND_INDEPENDENT_EVIDENCE',
  'runtime_activation_authorized',false
 )
from public.tenant_data_sovereignty_change_impact_v1 i
where i.assessment->>'contract'='powerhouse-cross-domain-change-v1'
  and i.assessment->>'status'='REVIEW_REQUIRED'
  and i.assessment->>'tenantId'=i.tenant_id
  and i.assessment->>'changeId'=i.change_id
  and i.assessment->>'deploymentApproved'='false'
on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone)
do nothing;
