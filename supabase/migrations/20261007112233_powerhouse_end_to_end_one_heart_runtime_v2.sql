
create or replace function public.powerhouse_backfill_internal_research_economics_v1(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  r record;
  v_count integer := 0;
begin
  for r in
    select a.action_id,a.executed_at,a.evidence
    from public.powerhouse_sales_actions a
    where a.status='done'
      and a.executed_at is not null
      and a.action_type='research_enrichment'
      and a.channel='internal'
      and coalesce((a.evidence->>'human_approved')::boolean,false)=false
      and coalesce((a.evidence->'public_research_execution'->>'evidence_only')::boolean,false)=true
      and not exists (
        select 1 from public.powerhouse_action_economics e where e.action_id=a.action_id
      )
  loop
    perform public.powerhouse_record_action_economics_v1(
      'economics:'||r.action_id::text,
      r.action_id,
      null,
      null,
      0,
      jsonb_build_object(
        'contract','powerhouse-internal-research-economics-v1',
        'human_minutes',0,
        'human_minutes_basis','action executed by automated internal research path with human_approved=false',
        'provider_cost_eur','UNOBSERVED',
        'external_cost_eur','UNOBSERVED',
        'no_zero_cost_claim',true,
        'truth_boundary','human time is observed as zero for this automated path; provider/external monetary cost remains unknown and is not fabricated',
        'source_evidence',coalesce(r.evidence->'public_research_execution','{}'::jsonb),
        'recorded_at',p_now
      ),
      r.executed_at
    );
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.powerhouse_backfill_social_learning_applications_v1(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare v_count integer:=0;
begin
  insert into public.social_learning_applications(
    tenant_id,application_id,post_id,learning_id,decision_id,applied_at,
    application_role,expected_effect,actual_effect,verification_status,updated_at
  )
  select
    p.tenant_id,
    'post-learning:'||md5(p.tenant_id||'|'||p.post_id||'|'||p.learning_id),
    p.post_id,
    p.learning_id,
    null,
    coalesce(p.published_at,p.created_at,p_now),
    'EXPLICIT_POST_LEARNING_LINEAGE',
    null,
    null,
    'LINEAGE_VERIFIED',
    p_now
  from public.social_posts p
  join public.social_learnings l
    on l.tenant_id=p.tenant_id and l.learning_id=p.learning_id
  where p.learning_id is not null
    and p.published_at is not null
  on conflict do nothing;
  get diagnostics v_count=row_count;
  return v_count;
end;
$$;

create or replace function public.powerhouse_runtime_scheduler_mux_v2(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  m integer := extract(minute from p_now)::integer;
  h integer := extract(hour from (p_now at time zone 'UTC'))::integer;
  v_base jsonb;
  v_sources jsonb := '[]'::jsonb;
  v_request bigint;
  v_econ integer := 0;
  v_social integer := 0;
begin
  v_base := public.powerhouse_runtime_scheduler_mux_v1(p_now);

  if h=4 and m=21 then
    v_request:=public.bg_roep_functie('powerhouse-dataforseo-intelligence');
    v_sources:=v_sources||jsonb_build_array(jsonb_build_object('task','dataforseo-intelligence','request_id',v_request));
  end if;

  if h=5 and m=16 then
    v_request:=public.bg_roep_functie('bg-gsc-sync');
    v_sources:=v_sources||jsonb_build_array(jsonb_build_object('task','gsc-search','request_id',v_request));
  end if;

  if (h=5 and m in (31,51)) or (h=6 and m=11) then
    v_request:=public.bg_roep_functie('bg-externe-signalen');
    v_sources:=v_sources||jsonb_build_array(jsonb_build_object('task','external-intelligence-bounded','request_id',v_request));
  end if;

  if h=6 and m=6 then
    v_request:=public.bg_roep_functie('bg-analytics-sync-composio');
    v_sources:=v_sources||jsonb_build_array(jsonb_build_object('task','ga4-analytics','request_id',v_request));
  end if;

  if m=38 then
    v_econ:=public.powerhouse_backfill_internal_research_economics_v1(p_now);
  end if;

  if m=39 then
    v_social:=public.powerhouse_backfill_social_learning_applications_v1(p_now);
  end if;

  return coalesce(v_base,'{}'::jsonb) || jsonb_build_object(
    'contract','powerhouse-runtime-scheduler-mux-v3',
    'canonical_owner','powerhouse-runtime-scheduler-mux-v1',
    'data_source_tasks',v_sources,
    'economics_backfilled',v_econ,
    'social_learning_applications_backfilled',v_social,
    'executed_at',p_now
  );
end;
$$;

do $$
declare j record;
begin
  for j in
    select jobname from cron.job
    where jobname in ('bg-gsc-sync-daily','bg-externe-signalen-dagelijks','powerhouse-dataforseo-intelligence-daily')
  loop
    perform cron.unschedule(j.jobname);
  end loop;

  if exists(select 1 from cron.job where jobname='powerhouse-runtime-scheduler-mux-v1') then
    perform cron.unschedule('powerhouse-runtime-scheduler-mux-v1');
  end if;

  perform cron.schedule(
    'powerhouse-runtime-scheduler-mux-v1',
    '1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59 * * * *',
    'select public.powerhouse_runtime_scheduler_mux_v2(now());'
  );
end $$;

create or replace view public.powerhouse_one_brain_runtime_health_v1 as
with inventory as (
  select layer_key,domain,authority,evidence_rows,required_for_autonomous_learning,wiring_state,evidence_state
  from public.powerhouse_one_brain_intelligence_inventory_v1
),
core_jobs(jobname,owner_jobname) as (
  values
  ('brain-outcome-horizon-hourly-v1','brain-outcome-horizon-hourly-v1'),
  ('powerhouse-autonomous-gap-closer-v1','powerhouse-autonomous-gap-closer-v1'),
  ('powerhouse-autonomous-improvement-cycle-v1','powerhouse-autonomous-improvement-cycle-v1'),
  ('powerhouse-commercial-learning-v1','powerhouse-commercial-learning-v1'),
  ('powerhouse-completion-evidence-hourly-v1','powerhouse-completion-evidence-hourly-v1'),
  ('powerhouse-content-closed-loop-v1','powerhouse-runtime-scheduler-mux-v1'),
  ('powerhouse-daily-action-set-reconcile-v1','powerhouse-runtime-scheduler-mux-v1'),
  ('powerhouse-evidence-maintenance-hourly-v1','powerhouse-evidence-maintenance-hourly-v1'),
  ('powerhouse-execution-learning-closure-v1','powerhouse-execution-learning-closure-v1'),
  ('powerhouse-execution-resilience-watchdog-v1','powerhouse-runtime-scheduler-mux-v1'),
  ('powerhouse-forecast-calibrator-daily','powerhouse-forecast-calibrator-daily'),
  ('powerhouse-full-cycle-proof-hourly-v1','powerhouse-full-cycle-proof-hourly-v1'),
  ('powerhouse-market-truth-maturity-hourly-v1','powerhouse-market-truth-maturity-hourly-v1'),
  ('powerhouse-predictive-engine-daily','powerhouse-predictive-engine-daily'),
  ('powerhouse-reconciliation-worker-v2','powerhouse-runtime-scheduler-mux-v1'),
  ('powerhouse-resource-intelligence-daily-v1','powerhouse-resource-intelligence-daily-v1'),
  ('powerhouse-revenue-intelligence-daily','powerhouse-revenue-intelligence-daily'),
  ('powerhouse-revenue-intelligence-snapshot-15m','powerhouse-revenue-intelligence-snapshot-15m')
),
jobs as (
  select c.jobname,c.owner_jobname,coalesce(j.active,false) active
  from core_jobs c
  left join cron.job j on j.jobname=c.owner_jobname
),
runtime as (
  select count(*) total_layers,
         count(*) filter(where wiring_state='WIRED') wired_layers
  from inventory
),
learning_gaps as (
  select (
    case when exists(
      select 1 from public.powerhouse_sales_actions a
      where a.status='done' and a.executed_at is not null
        and a.executed_at >= '2026-09-18 07:00:00+00'::timestamptz
        and not exists(select 1 from public.powerhouse_action_economics e where e.action_id=a.action_id)
    ) then 1 else 0 end
    +
    case when exists(select 1 from public.powerhouse_experiment_policies)
           and not exists(select 1 from public.powerhouse_experiment_assignments)
      then 1 else 0 end
    +
    case when exists(select 1 from public.powerhouse_experiment_policies)
           and not exists(select 1 from public.powerhouse_policy_versions)
      then 1 else 0 end
    +
    case when exists(
      select 1 from public.revenue_learning_obligations
      where type='FORECAST_CALIBRATION' and status='OPEN' and due_at<=now()
    ) then 1 else 0 end
  )::bigint evidence_sparse_required_layers
),
scheduler as (
  select count(*) required_jobs,
         count(*) filter(where active) active_jobs,
         count(*) filter(where not active) inactive_or_missing_jobs
  from jobs
),
content as (
  select count(*) recent_content_auth_errors
  from public.bg_gezondheid
  where onderdeel='powerhouse-content-orchestrator'
    and status='fout'
    and detail like 'HTTP 401:%'
    and coalesce(nullif(gegevens->>'aangeroepen_op','')::timestamptz,gemeten_op) >= now()-interval '30 minutes'
),
structural as (
  select identity_gaps,forecast_lineage_gaps
  from public.powerhouse_revenue_intelligence_health_v1
  limit 1
),
current_runtime as (
  with ranked as (
    select event_type,source,subject_key,state,evidence,updated_at,
           row_number() over(partition by event_type,source,subject_key order by updated_at desc,occurred_at desc,event_id desc) rn
    from public.powerhouse_runtime_events
    where updated_at>=now()-interval '2 hours'
  )
  select count(*) current_runtime_errors
  from ranked
  where rn=1 and state='error'
    and not(event_type='source_health_evaluated' and subject_key='forecast-calibration')
    and not(event_type='full_cycle_production_proof' and subject_key<>(now() at time zone 'Europe/Amsterdam')::date::text)
    and not(event_type='loop_assurance_refresh' and source='powerhouse-loop-assurance-v2')
),
content_truth as (
  select coalesce((
    select case when status='VERIFIED' and verified then 'VERIFIED' else status end
    from public.brain_records
    where tenant_id='canonical'
      and record_id='content-closed-loop:'||(now() at time zone 'Europe/Amsterdam')::date::text
    order by updated_at desc
    limit 1
  ),'MISSING') content_loop_state
)
select now() observed_at,
       runtime.total_layers,
       runtime.wired_layers,
       learning_gaps.evidence_sparse_required_layers,
       scheduler.required_jobs,
       scheduler.active_jobs,
       scheduler.inactive_or_missing_jobs,
       (coalesce(structural.identity_gaps,0)+coalesce(structural.forecast_lineage_gaps,0))::bigint structural_lineage_gaps,
       current_runtime.current_runtime_errors,
       content.recent_content_auth_errors,
       content_truth.content_loop_state,
       (
         select count(*)
         from public.powerhouse_sales_actions a
         where a.status='done' and a.executed_at is not null
           and a.executed_at < '2026-09-18 07:00:00+00'::timestamptz
           and not exists(select 1 from public.powerhouse_action_economics e where e.action_id=a.action_id)
       ) legacy_unmeasurable_economics_actions,
       case
         when runtime.wired_layers<>runtime.total_layers then 'RED'
         when scheduler.inactive_or_missing_jobs>0 then 'RED'
         when (coalesce(structural.identity_gaps,0)+coalesce(structural.forecast_lineage_gaps,0))>0 then 'RED'
         when current_runtime.current_runtime_errors>0 then 'AMBER'
         when content_truth.content_loop_state in ('BLOCKED','MISSING') then 'AMBER'
         else 'GREEN'
       end architecture_state,
       case when learning_gaps.evidence_sparse_required_layers>0 then 'EVIDENCE_DUE_GAPS' else 'EVIDENCE_CURRENT' end learning_state,
       'green wiring never fabricates economics, feedback, outcomes or causal evidence'::text truth_boundary
from runtime,learning_gaps,scheduler,content,structural,current_runtime,content_truth;

select public.powerhouse_backfill_internal_research_economics_v1(now());
select public.powerhouse_backfill_social_learning_applications_v1(now());
select public.powerhouse_data_spine_watchdog_v1(now());
