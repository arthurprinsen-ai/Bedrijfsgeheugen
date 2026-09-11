-- Project the authoritative AI governance registry into immutable canonical Brain records.
-- The registry remains the source of truth; brain_records is the append-only operating projection.

alter table public.brain_records drop constraint if exists brain_records_type_check;
alter table public.brain_records add constraint brain_records_type_check
  check (record_type in ('Evidence','Signal','Opportunity','Impact','Decision','Action','Execution','Verification','Outcome','Value','Learning','Memory','Entity','Relation','CurrentState','Governance'));

alter table public.brain_records drop constraint if exists brain_records_kind_check;
alter table public.brain_records add constraint brain_records_kind_check
  check (record_kind in ('evidence','signal','opportunity','impact','decision','action','execution','verification','outcome','value','learning','memory','entity','relation','current_state','governance'));

create or replace function public.brain_sync_ai_governance_record(
  p_tenant_id text,
  p_use_case_id text
)
returns public.brain_records
language plpgsql
security invoker
set search_path = public
as $$
declare
  v public.brain_ai_governance_registry;
  v_risk_level text;
  v_revision text;
  v_record_id text;
  v_verified boolean;
begin
  select * into v
  from public.brain_ai_governance_registry
  where tenant_id = p_tenant_id and use_case_id = p_use_case_id;

  if not found then raise exception 'AI_GOVERNANCE_USE_CASE_NOT_FOUND'; end if;

  v_risk_level := case v.risk_class
    when 'MINIMAL' then 'minimal_or_no_risk'
    when 'LIMITED' then 'transparency'
    when 'HIGH' then 'high'
    when 'PROHIBITED' then 'unacceptable'
    else null
  end;
  v_revision := to_char(v.updated_at at time zone 'UTC','YYYYMMDDHH24MISSUS');
  v_record_id := 'governance:' || v.use_case_id || ':' || v_revision;
  v_verified := v.approved
    and coalesce(array_length(v.evidence_ids,1),0) > 0
    and coalesce(array_length(v.approval_evidence_ids,1),0) > 0;

  return public.brain_append_record(
    v.tenant_id,
    v_record_id,
    'Governance',
    'governance',
    'ai:' || v.use_case_id,
    'ai-governance:' || v.use_case_id,
    '{}'::text[],
    v.owner_id,
    v.lifecycle_status,
    v.updated_at,
    false,
    v_verified,
    jsonb_build_object('approved',v.approved,'lifecycleStatus',v.lifecycle_status),
    coalesce(v.evidence_ids,'{}'::text[]) || coalesce(v.approval_evidence_ids,'{}'::text[]),
    jsonb_build_object('source','supabase','table','brain_ai_governance_registry','sourceId',v.use_case_id),
    jsonb_build_object(
      'systemName',v.name,
      'provider',v.provider,
      'model',v.model_id,
      'modelRevision',v.model_revision,
      'purpose',v.purpose,
      'role','deployer',
      'riskLevel',v_risk_level,
      'registryRiskClass',v.risk_class,
      'classificationSource','brain_ai_governance_registry.risk_class',
      'dataCategories',to_jsonb(coalesce(v.data_categories,'{}'::text[])),
      'prohibitedDataCategories',to_jsonb(coalesce(v.prohibited_data_categories,'{}'::text[])),
      'retentionPolicy',v.retention_policy,
      'humanOversight',jsonb_build_object(
        'required',(v.impact_assessment_required or v.risk_class = 'HIGH'),
        'control',v.human_oversight
      ),
      'transparencyControl',case when v.transparency_required then 'registry:transparency_required' else 'registry:not_required' end,
      'loggingControl','brain_records:append_only',
      'reviewDueAt',v.next_review_at,
      'lastReviewedAt',v.last_reviewed_at,
      'approved',v.approved,
      'approvalEvidenceIds',to_jsonb(coalesce(v.approval_evidence_ids,'{}'::text[])),
      'lifecycleStatus',v.lifecycle_status
    ),
    v_record_id,
    v_revision
  );
end;
$$;

revoke all on function public.brain_sync_ai_governance_record(text,text) from public, anon, authenticated;
grant execute on function public.brain_sync_ai_governance_record(text,text) to service_role;

create or replace function public.brain_ai_governance_project_after_write()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.brain_sync_ai_governance_record(new.tenant_id,new.use_case_id);
  return new;
end;
$$;

revoke all on function public.brain_ai_governance_project_after_write() from public, anon, authenticated;
grant execute on function public.brain_ai_governance_project_after_write() to service_role;

drop trigger if exists brain_ai_governance_project_after_write on public.brain_ai_governance_registry;
create trigger brain_ai_governance_project_after_write
after insert or update on public.brain_ai_governance_registry
for each row execute function public.brain_ai_governance_project_after_write();

-- Idempotent backfill of existing registry revisions.
do $$
declare r record;
begin
  for r in select tenant_id,use_case_id from public.brain_ai_governance_registry loop
    perform public.brain_sync_ai_governance_record(r.tenant_id,r.use_case_id);
  end loop;
end;
$$;
