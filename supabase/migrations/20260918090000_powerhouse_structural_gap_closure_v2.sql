-- Powerhouse structural gap closure v2
-- Deterministic, idempotent wiring only. No synthetic human feedback, realized value or customer connectors.

create or replace view public.powerhouse_tenant_identity_review_v1
with (security_invoker=true) as
select
  'scan_inzendingen'::text as surface,
  s.id as source_id,
  s.klant_slug,
  s.tenant_identity_status,
  case when lower(btrim(coalesce(s.klant_slug,''))) in ('demo','test') then 'demo_or_test' else 'production_or_unknown' end as record_class,
  case
    when lower(btrim(coalesce(s.klant_slug,''))) in ('demo','test') then 'demo_or_test'
    when nullif(btrim(s.klant_slug),'') is null then 'missing_slug'
    when (
      select count(*) from public.organisaties o
      where lower(btrim(o.slug)) = lower(btrim(s.klant_slug))
    ) = 0 then 'no_organisatie_slug_match'
    else 'ambiguous_organisatie_slug_match'
  end as review_reason,
  (
    select count(*)::integer from public.organisaties o
    where nullif(btrim(s.klant_slug),'') is not null
      and lower(btrim(o.slug)) = lower(btrim(s.klant_slug))
  ) as candidate_count,
  s.aangemaakt as observed_at
from public.scan_inzendingen s
where s.organisatie_id is null

union all

select
  'offerte_inzendingen'::text as surface,
  oin.id as source_id,
  oin.klant_slug,
  oin.tenant_identity_status,
  case when lower(btrim(coalesce(oin.klant_slug,''))) in ('demo','test') then 'demo_or_test' else 'production_or_unknown' end as record_class,
  case
    when lower(btrim(coalesce(oin.klant_slug,''))) in ('demo','test') then 'demo_or_test'
    when nullif(btrim(oin.klant_slug),'') is null then 'missing_slug'
    when (
      select count(*) from public.organisaties o
      where lower(btrim(o.slug)) = lower(btrim(oin.klant_slug))
    ) = 0 then 'no_organisatie_slug_match'
    else 'ambiguous_organisatie_slug_match'
  end as review_reason,
  (
    select count(*)::integer from public.organisaties o
    where nullif(btrim(oin.klant_slug),'') is not null
      and lower(btrim(o.slug)) = lower(btrim(oin.klant_slug))
  ) as candidate_count,
  oin.aangemaakt as observed_at
from public.offerte_inzendingen oin
where oin.organisatie_id is null;

revoke all on public.powerhouse_tenant_identity_review_v1 from anon, authenticated;
grant select on public.powerhouse_tenant_identity_review_v1 to service_role;

create or replace function public.powerhouse_materialize_sales_action_cycle_row_v1(p_action_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  a public.powerhouse_sales_actions%rowtype;
  v_tenant constant text := 'canonical';
  v_subject text;
  v_evidence_ref text;
begin
  select * into a
  from public.powerhouse_sales_actions
  where action_id=p_action_id;

  if not found then
    return;
  end if;

  v_subject := coalesce(
    nullif(a.subject_key,''),
    nullif(a.company_key,''),
    nullif(a.person_key,''),
    a.action_id::text
  );
  v_evidence_ref := 'powerhouse_sales_actions:' || a.action_id::text;

  insert into public.powerhouse_decision_cycles(
    tenant_id,cycle_id,subject_key,source_signal_ref,current_stage,status,opened_at,updated_at
  )
  values(
    v_tenant,
    a.action_id,
    v_subject,
    v_evidence_ref,
    'signal',
    'open',
    coalesce(a.created_at,now()),
    now()
  )
  on conflict (tenant_id,cycle_id) do update set
    subject_key=coalesce(public.powerhouse_decision_cycles.subject_key,excluded.subject_key),
    source_signal_ref=excluded.source_signal_ref,
    updated_at=now();

  if not exists (
    select 1
    from public.powerhouse_cycle_events
    where tenant_id=v_tenant
      and idempotency_key='sales-action:' || a.action_id::text || ':signal'
  ) then
    insert into public.powerhouse_cycle_events(
      tenant_id,cycle_id,sequence_no,stage,entity_type,entity_id,
      evidence_ref,idempotency_key,payload,occurred_at
    )
    values(
      v_tenant,
      a.action_id,
      1,
      'signal',
      'powerhouse_sales_actions',
      a.action_id::text,
      v_evidence_ref,
      'sales-action:' || a.action_id::text || ':signal',
      jsonb_build_object(
        'status',a.status,
        'action_type',a.action_type,
        'channel',a.channel,
        'priority',a.priority,
        'opportunity_key',a.opportunity_key,
        'truth','observed_sales_action_bootstrap_signal',
        'canonical_gap','analysis_prediction_decision_not_reconstructed_without_evidence'
      ),
      coalesce(a.created_at,now())
    );
  end if;
end
$$;

revoke execute on function public.powerhouse_materialize_sales_action_cycle_row_v1(uuid) from public, anon, authenticated;
grant execute on function public.powerhouse_materialize_sales_action_cycle_row_v1(uuid) to service_role;

create or replace function public.powerhouse_materialize_sales_action_cycle_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  perform public.powerhouse_materialize_sales_action_cycle_row_v1(new.action_id);
  return new;
end
$$;

revoke execute on function public.powerhouse_materialize_sales_action_cycle_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_materialize_sales_action_cycle_v1() to service_role;

drop trigger if exists powerhouse_sales_actions_cycle_materializer_v1 on public.powerhouse_sales_actions;
create trigger powerhouse_sales_actions_cycle_materializer_v1
after insert or update of status,executed_at,subject_key,company_key,person_key
on public.powerhouse_sales_actions
for each row execute function public.powerhouse_materialize_sales_action_cycle_v1();

select public.powerhouse_materialize_sales_action_cycle_row_v1(action_id)
from public.powerhouse_sales_actions
order by created_at,action_id;

create or replace view public.powerhouse_completion_readiness_v1
with (security_invoker=true) as
with source_state as (
  select s.source_key,s.source_class,s.required,s.max_age,
         max(o.observed_at) last_observed_at,
         case
           when max(o.observed_at) is null then 'MISSING'
           when now()-max(o.observed_at) > s.max_age then 'STALE'
           else 'FRESH'
         end freshness
  from public.powerhouse_evidence_sources s
  left join public.powerhouse_evidence_source_observations o using(source_key)
  group by s.source_key,s.source_class,s.required,s.max_age
),
forecast as (
  select
    count(*) filter(where status in ('active','claimed')) active_forecasts,
    count(*) filter(where status in ('materialized','expired')) terminal_forecasts,
    (select count(*) from public.powerhouse_forecast_calibration) calibrations,
    (select count(*) from public.revenue_learning_obligations where type='FORECAST_CALIBRATION' and status='OPEN') open_calibration_obligations,
    (select count(*) from public.revenue_learning_obligations where type='FORECAST_CALIBRATION' and status='OPEN' and due_at <= now()) overdue_calibration_obligations,
    (select count(*) from public.revenue_learning_obligations where type='FORECAST_CALIBRATION' and status='OPEN' and due_at > now()) future_calibration_obligations
  from public.powerhouse_forecasts
),
learning as (
  select
    (select count(*) from public.powerhouse_human_feedback_events) human_feedback_events,
    (select count(*) from public.powerhouse_realized_values) realized_values,
    (select count(*) from public.powerhouse_action_economics) action_economics,
    (select count(*) from public.powerhouse_decision_cycles) decision_cycles,
    (select count(*) from public.powerhouse_cycle_events) cycle_events,
    (select count(*) from public.powerhouse_decision_cycles
      where current_stage='signal' and source_signal_ref like 'powerhouse_sales_actions:%') cycles_waiting_for_stage_reconstruction,
    (select count(*) from public.powerhouse_predictive_signals) predictive_signals,
    (select count(*) from public.powerhouse_sales_actions where status='done' and executed_at is not null) executed_done_actions,
    (
      select count(*)
      from public.powerhouse_sales_actions a
      where a.status='done' and a.executed_at is not null
        and not exists(select 1 from public.powerhouse_action_economics e where e.action_id=a.action_id)
    ) executed_actions_missing_observed_economics,
    (
      select count(*)
      from public.powerhouse_sales_actions a
      where a.executed_at is not null
        and not exists(select 1 from public.powerhouse_human_feedback_events f where f.action_id=a.action_id)
    ) executed_actions_without_explicit_human_feedback
),
customer_connectors as (
  select
    (select count(*) from public.connector_definitions) definitions,
    (select count(*) from public.connector_executions) executions,
    (select count(*) from public.connector_reviews where status='pending') pending_reviews
),
platform_sources as (
  select
    count(*) total_sources,
    count(*) filter(where required) required_sources,
    count(*) filter(where freshness='FRESH') fresh_sources,
    count(*) filter(where required and freshness<>'FRESH') unhealthy_required_sources
  from source_state
),
tenant_review as (
  select
    count(*) unresolved_records,
    count(*) filter(where record_class='demo_or_test') demo_or_test_records,
    count(*) filter(where record_class='production_or_unknown') production_or_unknown_unresolved_records,
    count(*) filter(where record_class='production_or_unknown' and candidate_count=0) no_match_records,
    count(*) filter(where record_class='production_or_unknown' and candidate_count>1) ambiguous_records
  from public.powerhouse_tenant_identity_review_v1
)
select jsonb_build_object(
  'contract','powerhouse-completion-layer-v2',
  'observed_at',now(),
  'evidence_sources',coalesce((select jsonb_agg(to_jsonb(source_state) order by required desc,source_key) from source_state),'[]'::jsonb),
  'required_sources_unhealthy',(select count(*) from source_state where required and freshness<>'FRESH'),
  'tenant_identity',coalesce((select jsonb_agg(to_jsonb(t) order by surface) from public.powerhouse_tenant_identity_readiness_v1 t),'[]'::jsonb),
  'tenant_identity_review',to_jsonb(tenant_review),
  'forecast',to_jsonb(forecast),
  'learning',to_jsonb(learning),
  'connectors',to_jsonb(customer_connectors),
  'customer_connectors',to_jsonb(customer_connectors),
  'platform_sources',to_jsonb(platform_sources)
) as snapshot
from forecast,learning,customer_connectors,platform_sources,tenant_review;

revoke all on public.powerhouse_completion_readiness_v1 from anon, authenticated;
grant select on public.powerhouse_completion_readiness_v1 to service_role;

comment on view public.powerhouse_tenant_identity_review_v1 is
'Live unresolved-identity review surface. Does not create a parallel queue; derives only from scan/offerte authority.';
comment on function public.powerhouse_materialize_sales_action_cycle_row_v1(uuid) is
'Idempotently creates the truthful signal-stage bootstrap for an existing powerhouse_sales_actions row. Later canonical stages are never fabricated: analysis, prediction, decision, execution and outcome require their own evidence.';


-- ONE BRAIN runtime inventory and reconciliation v1
-- One derived inventory, one reconciliation authority, zero parallel truth stores.
-- Code/model capability remains in GitHub; runtime truth remains in canonical Supabase authorities.

create or replace view public.powerhouse_one_brain_intelligence_inventory_v1
with (security_invoker=true) as
with layers as (
  select 'agent_chat_control_plane'::text layer_key,'control_plane'::text domain,'brain_control_plane_bindings'::text authority,
    (select count(*)::bigint from public.brain_control_plane_bindings) evidence_rows,true required_for_autonomous_learning
  union all select 'canonical_memory','knowledge','brain_records',(select count(*)::bigint from public.brain_records),true
  union all select 'failure_learning','learning','brain_failure_registry',(select count(*)::bigint from public.brain_failure_registry),true
  union all select 'outcome_obligations','learning','brain_outcome_obligation_evidence',(select count(*)::bigint from public.brain_outcome_obligation_evidence),true
  union all select 'predictive_signals','prediction','powerhouse_predictive_signals',(select count(*)::bigint from public.powerhouse_predictive_signals),true
  union all select 'forecasts','prediction','powerhouse_forecasts',(select count(*)::bigint from public.powerhouse_forecasts),true
  union all select 'forecast_calibration','calibration','powerhouse_forecast_calibration',(select count(*)::bigint from public.powerhouse_forecast_calibration),true
  union all select 'external_intelligence','signals','bg_externe_signalen',(select count(*)::bigint from public.bg_externe_signalen),false
  union all select 'search_intelligence','signals','bg_zoekprestaties',(select count(*)::bigint from public.bg_zoekprestaties),false
  union all select 'behavior_intelligence','signals','bg_interacties',(select count(*)::bigint from public.bg_interacties),false
  union all select 'opportunity_intelligence','decision_support','powerhouse_opportunities',(select count(*)::bigint from public.powerhouse_opportunities),true
  union all select 'sales_action_intelligence','execution','powerhouse_sales_actions',(select count(*)::bigint from public.powerhouse_sales_actions),true
  union all select 'decision_cycles','decision','powerhouse_decision_cycles',(select count(*)::bigint from public.powerhouse_decision_cycles),true
  union all select 'cycle_events','decision','powerhouse_cycle_events',(select count(*)::bigint from public.powerhouse_cycle_events),true
  union all select 'brain_decisions','decision','brain_decisions',(select count(*)::bigint from public.brain_decisions),false
  union all select 'value_evaluation','value','brain_value_evaluations',(select count(*)::bigint from public.brain_value_evaluations),true
  union all select 'action_economics','economics','powerhouse_action_economics',(select count(*)::bigint from public.powerhouse_action_economics),true
  union all select 'human_feedback','learning','powerhouse_human_feedback_events',(select count(*)::bigint from public.powerhouse_human_feedback_events),true
  union all select 'experiment_assignments','experimentation','powerhouse_experiment_assignments',(select count(*)::bigint from public.powerhouse_experiment_assignments),true
  union all select 'policy_versions','policy_learning','powerhouse_policy_versions',(select count(*)::bigint from public.powerhouse_policy_versions),true
  union all select 'social_learning','learning','social_learnings',(select count(*)::bigint from public.social_learnings),false
  union all select 'revenue_learning','learning','revenue_learnings',(select count(*)::bigint from public.revenue_learnings),true
  union all select 'content_recommendations','content_intelligence','powerhouse_content_recommendations',(select count(*)::bigint from public.powerhouse_content_recommendations),false
  union all select 'channel_decisions','content_intelligence','powerhouse_channel_decisions',(select count(*)::bigint from public.powerhouse_channel_decisions),false
  union all select 'content_artifacts','content_intelligence','powerhouse_content_artifacts',(select count(*)::bigint from public.powerhouse_content_artifacts),false
  union all select 'publication_obligations','execution','content_publication_obligations',(select count(*)::bigint from public.content_publication_obligations),false
  union all select 'resource_intelligence','economics','powerhouse_resource_factors',(select count(*)::bigint from public.powerhouse_resource_factors),false
  union all select 'quality_intelligence','quality','powerhouse_quality_events',(select count(*)::bigint from public.powerhouse_quality_events),false
  union all select 'security_intelligence','security','powerhouse_security_guard_events',(select count(*)::bigint from public.powerhouse_security_guard_events),false
  union all select 'production_truth','production','brain_production_truth',(select count(*)::bigint from public.brain_production_truth),true
  union all select 'delivery_evidence','delivery','brain_delivery_evidence',(select count(*)::bigint from public.brain_delivery_evidence),true
  union all select 'ai_governance','governance','brain_ai_governance_registry',(select count(*)::bigint from public.brain_ai_governance_registry where approved=true),true
)
select
  layer_key,domain,authority,evidence_rows,required_for_autonomous_learning,
  'WIRED'::text wiring_state,
  case when evidence_rows>0 then 'OBSERVED' else 'NO_EVIDENCE_YET' end evidence_state
from layers;

revoke all on public.powerhouse_one_brain_intelligence_inventory_v1 from anon,authenticated;
grant select on public.powerhouse_one_brain_intelligence_inventory_v1 to service_role;

create or replace view public.powerhouse_one_brain_runtime_health_v1
with (security_invoker=true) as
with inventory as (
  select * from public.powerhouse_one_brain_intelligence_inventory_v1
), core_jobs(jobname) as (
  values
    ('brain-outcome-horizon-hourly-v1'),
    ('powerhouse-autonomous-gap-closer-v1'),
    ('powerhouse-autonomous-improvement-cycle-v1'),
    ('powerhouse-commercial-learning-v1'),
    ('powerhouse-completion-evidence-hourly-v1'),
    ('powerhouse-content-closed-loop-v1'),
    ('powerhouse-daily-action-set-reconcile-v1'),
    ('powerhouse-evidence-maintenance-hourly-v1'),
    ('powerhouse-execution-learning-closure-v1'),
    ('powerhouse-execution-resilience-watchdog-v1'),
    ('powerhouse-forecast-calibrator-daily'),
    ('powerhouse-full-cycle-proof-hourly-v1'),
    ('powerhouse-market-truth-maturity-hourly-v1'),
    ('powerhouse-predictive-engine-daily'),
    ('powerhouse-reconciliation-worker-v1'),
    ('powerhouse-resource-intelligence-daily-v1'),
    ('powerhouse-revenue-intelligence-daily'),
    ('powerhouse-revenue-intelligence-snapshot-15m')
), jobs as (
  select c.jobname,coalesce(j.active,false) active
  from core_jobs c
  left join cron.job j on j.jobname=c.jobname
), runtime as (
  select
    count(*)::bigint total_layers,
    count(*) filter(where wiring_state='WIRED')::bigint wired_layers,
    count(*) filter(where required_for_autonomous_learning and evidence_state='NO_EVIDENCE_YET')::bigint evidence_sparse_required_layers
  from inventory
), scheduler as (
  select count(*)::bigint required_jobs,
         count(*) filter(where active)::bigint active_jobs,
         count(*) filter(where not active)::bigint inactive_or_missing_jobs
  from jobs
), content as (
  select count(*)::bigint recent_content_auth_errors
  from public.bg_gezondheid
  where onderdeel='powerhouse-content-orchestrator'
    and status='fout'
    and detail like 'HTTP 401:%'
    and gemeten_op >= now()-interval '30 minutes'
), structural as (
  select *
  from public.powerhouse_revenue_intelligence_health_v1
  limit 1
)
select
  now() observed_at,
  runtime.total_layers,
  runtime.wired_layers,
  runtime.evidence_sparse_required_layers,
  scheduler.required_jobs,
  scheduler.active_jobs,
  scheduler.inactive_or_missing_jobs,
  coalesce(structural.structural_lineage_gaps,0)::bigint structural_lineage_gaps,
  coalesce(structural.runtime_errors,0)::bigint revenue_runtime_errors,
  content.recent_content_auth_errors,
  case
    when runtime.wired_layers<>runtime.total_layers then 'RED'
    when scheduler.inactive_or_missing_jobs>0 then 'RED'
    when coalesce(structural.structural_lineage_gaps,0)>0 then 'AMBER'
    when content.recent_content_auth_errors>0 then 'AMBER'
    else 'GREEN'
  end architecture_state,
  case
    when runtime.evidence_sparse_required_layers>0 then 'EVIDENCE_SPARSE'
    else 'EVIDENCE_ACTIVE'
  end learning_state,
  'green wiring never fabricates economics, feedback, outcomes or causal evidence'::text truth_boundary
from runtime,scheduler,content,structural;

revoke all on public.powerhouse_one_brain_runtime_health_v1 from anon,authenticated;
grant select on public.powerhouse_one_brain_runtime_health_v1 to service_role;

create or replace function public.powerhouse_one_brain_reconcile_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  a record;
  p record;
  v_actions bigint:=0;
  v_policies bigint:=0;
  v_promoted bigint:=0;
  v_promotion jsonb;
  v_health jsonb;
begin
  -- Every existing and future sales action is attached to the canonical cycle authority.
  for a in select action_id from public.powerhouse_sales_actions order by created_at,action_id loop
    perform public.powerhouse_materialize_sales_action_cycle_row_v1(a.action_id);
    v_actions:=v_actions+1;
  end loop;

  -- Reuse existing truth-producing engines; never duplicate their stores.
  perform public.powerhouse_refresh_forecast_calibration_obligations();
  perform public.powerhouse_mature_experiment_assignments_v1(p_now);

  -- Proven experiment policies may promote; sparse/contaminated/unproven policies stay fail-closed.
  for p in select experiment_key from public.powerhouse_experiment_policies order by experiment_key loop
    v_policies:=v_policies+1;
    begin
      v_promotion:=public.powerhouse_promote_policy_if_proven_v1(p.experiment_key);
      if coalesce((v_promotion->>'promoted')::boolean,false) then
        v_promoted:=v_promoted+1;
      end if;
    exception when others then
      -- One policy must not stop reconciliation of all other intelligence layers.
      null;
    end;
  end loop;

  select to_jsonb(h) into v_health from public.powerhouse_one_brain_runtime_health_v1 h limit 1;
  return jsonb_build_object(
    'contract','powerhouse-one-brain-runtime-v1',
    'reconciled_at',p_now,
    'sales_actions_seen',v_actions,
    'experiment_policies_seen',v_policies,
    'policies_promoted',v_promoted,
    'health',v_health,
    'truth_boundary','no synthetic stages, economics, feedback, outcomes or causal proof'
  );
end
$$;

revoke execute on function public.powerhouse_one_brain_reconcile_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_one_brain_reconcile_v1(timestamptz) to service_role;

do $$
declare v_job bigint;
begin
  select jobid into v_job from cron.job where jobname='powerhouse-one-brain-reconcile-v1' limit 1;
  if v_job is not null then perform cron.unschedule(v_job); end if;
  perform cron.schedule(
    'powerhouse-one-brain-reconcile-v1',
    '*/10 * * * *',
    'select public.powerhouse_one_brain_reconcile_v1(now());'
  );
end
$$;

comment on view public.powerhouse_one_brain_intelligence_inventory_v1 is
'Canonical derived inventory of Powerhouse intelligence layers. It exposes runtime evidence without creating a parallel authority.';
comment on view public.powerhouse_one_brain_runtime_health_v1 is
'One Brain structural/scheduler/learning health. GREEN means wiring and required schedulers are present; evidence maturity remains separately fail-closed.';
comment on function public.powerhouse_one_brain_reconcile_v1(timestamptz) is
'Idempotent canonical reconciliation across cycle materialization, calibration obligations, experiment maturity and proven policy promotion. Reuses existing authorities and never fabricates missing evidence.';
