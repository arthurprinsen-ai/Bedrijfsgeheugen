-- Powerhouse Commercial Closed Loop v2
-- Extends the existing Growth & Revenue OS. No parallel brain, queue, scheduler or learning store.

create or replace view public.powerhouse_source_freshness_v1 as
with source_contract as (
  select * from (values
    ('website_analytics'::text, true,  interval '36 hours', 'bg-analytics-sync-composio'::text,
      (select max(updated_at) from public.growth_page_daily)),
    ('search_console'::text,   true,  interval '8 days',   'bg-gsc-sync'::text,
      (select max(datum::timestamptz) from public.bg_zoekprestaties)),
    ('social_metrics'::text,   true,  interval '36 hours', 'bg-buffer-sync-daily'::text,
      (select max(observed_at) from public.social_metric_snapshots)),
    ('social_delivery'::text,  false, interval '8 days',   'bg-buffer-sync-daily'::text,
      (select max(coalesce(published_at,created_at)) from public.social_posts)),
    ('linkedin_intelligence'::text,true, interval '36 hours','powerhouse-linkedin-sales-intelligence'::text,
      (select max(gemeten_op) from public.bg_gezondheid where onderdeel='powerhouse-linkedin-sales-intelligence')),
    ('external_research'::text,true, interval '36 hours','external-research-feeds'::text,
      (select max(gemeten_op) from public.bg_gezondheid where onderdeel='external-research-feeds')),
    ('sales_outcomes'::text,   false, interval '30 days',  null::text,
      (select max(occurred_at) from public.powerhouse_sales_outcomes))
  ) as v(source_key, required_for_daily_loop, expected_max_age, health_component, latest_evidence_at)
), latest_health as (
  select distinct on (g.onderdeel)
    g.onderdeel, g.status as provider_health_status, g.detail as provider_health_detail, g.gemeten_op as provider_health_at
  from public.bg_gezondheid g
  join source_contract c on c.health_component=g.onderdeel
  order by g.onderdeel, g.gemeten_op desc
)
select
  c.source_key,
  c.required_for_daily_loop,
  c.latest_evidence_at,
  c.expected_max_age,
  case when c.latest_evidence_at is null then null else now()-c.latest_evidence_at end as evidence_age,
  h.provider_health_status,
  h.provider_health_detail,
  h.provider_health_at,
  case
    when c.latest_evidence_at is null and c.required_for_daily_loop then 'missing'
    when c.latest_evidence_at is null then 'no_event'
    when now()-c.latest_evidence_at > c.expected_max_age then 'stale'
    when coalesce(lower(h.provider_health_status),'') in ('fout','error','failed') then 'fresh_with_warning'
    when coalesce(lower(h.provider_health_status),'') in ('waarschuwing','warning','degraded') then 'fresh_with_warning'
    else 'fresh'
  end as freshness_status,
  jsonb_build_object(
    'source_key',c.source_key,
    'required',c.required_for_daily_loop,
    'latest_evidence_at',c.latest_evidence_at,
    'expected_max_age_seconds',extract(epoch from c.expected_max_age)::bigint,
    'provider_health_status',h.provider_health_status,
    'provider_health_detail',h.provider_health_detail,
    'provider_health_at',h.provider_health_at
  ) as evidence
from source_contract c
left join latest_health h on h.onderdeel=c.health_component;

alter view public.powerhouse_source_freshness_v1 set (security_invoker = true);
revoke all on table public.powerhouse_source_freshness_v1 from public, anon, authenticated;
grant select on table public.powerhouse_source_freshness_v1 to service_role;

create or replace function public.powerhouse_prepare_safe_actions_v1(p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date))
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_internal_prepared integer := 0;
  v_external_prepared integer := 0;
  v_external_fail_closed integer := 0;
  v_outbound_used integer := 0;
  v_remaining integer := 0;
begin
  -- Internal research/enrichment is the only class that can be prepared without an external provider side effect.
  update public.powerhouse_sales_actions a
  set status='prepared',
      evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
        'preparation_contract','powerhouse-commercial-closed-loop-v2',
        'prepared_reason','safe_internal_execution_class',
        'prepared_at',now()
      ),
      updated_at=now()
  where a.status='suggested'
    and lower(coalesce(a.channel,'')) in ('internal','internal_research')
    and a.action_type='research_enrichment';
  get diagnostics v_internal_prepared = row_count;

  -- Existing direct outbound already prepared/actioned today consumes the autonomous daily pressure budget.
  select count(*)::integer into v_outbound_used
  from public.powerhouse_sales_actions a
  where (a.created_at at time zone 'Europe/Amsterdam')::date=p_run_date
    and lower(coalesce(a.channel,'')) in ('e-mail','email','linkedin dm','linkedin_dm')
    and a.status in ('prepared','waiting','queued','approved','scheduled','executed','completed','done');
  v_remaining := greatest(0,5-v_outbound_used);

  -- Direct outreach is fail-closed. It can only be prepared when every canonical execution proof is explicitly true.
  with eligible as (
    select a.action_id,
           row_number() over(order by a.priority desc nulls last,a.created_at,a.action_id) as rn
    from public.powerhouse_sales_actions a
    where a.status='suggested'
      and lower(coalesce(a.channel,'')) in ('e-mail','email','linkedin dm','linkedin_dm')
      and coalesce(a.evidence->'execution_gate'->>'exact_destination_verified','false')='true'
      and coalesce(a.evidence->'execution_gate'->>'eligibility_verified','false')='true'
      and coalesce(a.evidence->'execution_gate'->>'contact_pressure_ok','false')='true'
      and coalesce(a.evidence->'execution_gate'->>'identity_verified','false')='true'
      and coalesce(a.evidence->'execution_gate'->>'truth_verified','false')='true'
      and coalesce(a.evidence->'execution_gate'->>'provider_capability_verified','false')='true'
  )
  update public.powerhouse_sales_actions a
  set status='prepared',
      evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
        'preparation_contract','powerhouse-commercial-closed-loop-v2',
        'prepared_reason','all_outbound_hard_gates_verified',
        'prepared_at',now()
      ),
      updated_at=now()
  from eligible e
  where a.action_id=e.action_id and e.rn<=v_remaining;
  get diagnostics v_external_prepared = row_count;

  -- Make the hold explicit instead of silently leaving unsafe outreach indistinguishable from ready work.
  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
        'execution_gate',coalesce(a.evidence->'execution_gate','{}'::jsonb) || jsonb_build_object(
          'fail_closed',true,
          'required_proof',jsonb_build_array(
            'exact_destination_verified','eligibility_verified','contact_pressure_ok',
            'identity_verified','truth_verified','provider_capability_verified'
          ),
          'checked_at',now()
        )
      ),
      updated_at=now()
  where a.status='suggested'
    and lower(coalesce(a.channel,'')) in ('e-mail','email','linkedin dm','linkedin_dm')
    and not (
      coalesce(a.evidence->'execution_gate'->>'exact_destination_verified','false')='true'
      and coalesce(a.evidence->'execution_gate'->>'eligibility_verified','false')='true'
      and coalesce(a.evidence->'execution_gate'->>'contact_pressure_ok','false')='true'
      and coalesce(a.evidence->'execution_gate'->>'identity_verified','false')='true'
      and coalesce(a.evidence->'execution_gate'->>'truth_verified','false')='true'
      and coalesce(a.evidence->'execution_gate'->>'provider_capability_verified','false')='true'
    );
  get diagnostics v_external_fail_closed = row_count;

  return jsonb_build_object(
    'contract','powerhouse-commercial-closed-loop-v2',
    'run_date',p_run_date,
    'internal_actions_prepared',v_internal_prepared,
    'external_actions_prepared',v_external_prepared,
    'external_actions_fail_closed',v_external_fail_closed,
    'outbound_daily_limit',5,
    'outbound_used_before_run',v_outbound_used,
    'direct_outreach_execution_performed',false
  );
end;
$$;

revoke all on function public.powerhouse_prepare_safe_actions_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_prepare_safe_actions_v1(date) to service_role;

create or replace function public.powerhouse_commercial_closed_loop_v2(p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date))
returns jsonb
language plpgsql
set search_path = public, pg_temp, cron
as $$
declare
  v_linkedin jsonb;
  v_learning jsonb;
  v_actions jsonb;
  v_guard jsonb;
  v_sources jsonb;
  v_maturity jsonb;
  v_required_bad integer := 0;
  v_required_warnings integer := 0;
  v_observed_revenue numeric := 0;
  v_calibrations integer := 0;
  v_outcomes integer := 0;
  v_commercial_maturity text := 'insufficient_evidence';
  v_health_status text := 'ok';
  v_payload jsonb;
begin
  v_linkedin := public.powerhouse_refresh_linkedin_sales_intelligence_v1(p_run_date);
  v_learning := public.powerhouse_commercial_learning_cycle_v1(p_run_date);
  v_actions := public.powerhouse_prepare_safe_actions_v1(p_run_date);

  select coalesce(jsonb_agg(to_jsonb(s) order by s.source_key),'[]'::jsonb),
         count(*) filter(where s.required_for_daily_loop and s.freshness_status in ('missing','stale'))::integer,
         count(*) filter(where s.required_for_daily_loop and s.freshness_status='fresh_with_warning')::integer
    into v_sources,v_required_bad,v_required_warnings
  from public.powerhouse_source_freshness_v1 s;

  -- Preserve the existing delivery/publication reconciliation authority.
  v_guard := public.powerhouse_daily_execution_guard(p_run_date);

  select to_jsonb(m),coalesce(m.realized_revenue_eur,0),coalesce(m.calibrations,0),coalesce(m.outcome_count,0)
    into v_maturity,v_observed_revenue,v_calibrations,v_outcomes
  from public.powerhouse_commercial_maturity_v1 m
  limit 1;

  -- Observed realized revenue is the only revenue truth boundary. Lack of evidence never becomes invented maturity.
  if v_calibrations > 0 and v_outcomes > 1 and v_observed_revenue > 0 then
    v_commercial_maturity := 'observed_learning_active';
  else
    v_commercial_maturity := 'insufficient_evidence';
  end if;

  if v_required_bad > 0 then
    v_health_status := 'fout';
  elsif v_required_warnings > 0 then
    v_health_status := 'waarschuwing';
  end if;

  v_payload := jsonb_build_object(
    'contract','powerhouse-commercial-closed-loop-v2',
    'run_date',p_run_date,
    'linkedin_sales_intelligence',v_linkedin,
    'commercial_learning',v_learning,
    'safe_action_preparation',v_actions,
    'source_freshness',v_sources,
    'required_sources_bad',v_required_bad,
    'required_sources_warning',v_required_warnings,
    'daily_execution_guard',v_guard,
    'commercial_control_room',v_maturity,
    'commercial_maturity',v_commercial_maturity,
    'observed_realized_revenue_eur',v_observed_revenue,
    'executed_at',now()
  );

  update public.powerhouse_daily_runs
  set evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object('commercial_closed_loop_v2',v_payload),
      state=case when v_required_bad>0 then 'degraded' else state end,
      updated_at=now()
  where run_date=p_run_date;

  insert into public.bg_gezondheid(onderdeel,soort,status,detail,gegevens)
  values(
    'powerhouse-commercial-closed-loop-v2','closed_loop',v_health_status,
    case
      when v_required_bad>0 then 'Verplichte databron ontbreekt of is stale; closed loop blijft fail-closed.'
      when v_required_warnings>0 then 'Data is vers maar minstens één verplichte provider/sync meldt een waarschuwing of fout.'
      else 'Commerciële closed loop uitgevoerd met verse verplichte brondata.'
    end,
    v_payload
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'powerhouse-commercial-closed-loop-v2:'||p_run_date::text,
    'commercial_closed_loop','powerhouse-commercial-closed-loop-v2','growth-revenue-os',now(),
    v_payload,
    jsonb_build_object('root_cause','Commercial capabilities existed independently but were not mandatory from the scheduler-owned daily path.'),
    'closed','OBSERVED',1
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=now();

  insert into public.powerhouse_sales_learnings(
    fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,sample_size,updated_at
  ) values(
    'powerhouse-commercial-closed-loop-orchestration-v2',
    'growth-revenue-os','system',
    'Every mandatory commercial capability must be reachable from one scheduler-owned closed-loop orchestrator; direct outbound remains fail-closed without destination, eligibility, contact-pressure, identity, truth and provider proof.',
    jsonb_build_object(
      'root_cause','Commercial intelligence/learning/freshness components existed but the scheduler authority invoked only the legacy execution guard.',
      'production_contract','powerhouse-commercial-closed-loop-v2',
      'run_date',p_run_date,
      'source_freshness',v_sources,
      'safe_action_preparation',v_actions
    ),
    jsonb_build_object(
      'prevention_rule','One scheduler-owned commercial orchestrator must invoke intelligence, learning, safe action preparation, freshness readback and the existing execution guard every run.',
      'truth_boundary','Observed realized revenue only; insufficient evidence remains explicit.'
    ),
    1,'proven',greatest(1,v_outcomes),now()
  )
  on conflict(fingerprint) do update set
    evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,status=excluded.status,
    sample_size=excluded.sample_size,updated_at=now();

  return v_payload;
end;
$$;

revoke all on function public.powerhouse_commercial_closed_loop_v2(date) from public, anon, authenticated;
grant execute on function public.powerhouse_commercial_closed_loop_v2(date) to service_role;

-- Retarget the single existing scheduler authority. Do not create a parallel cron.
do $$
declare v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname='powerhouse-execution-guard-hourly' limit 1;
  if v_job_id is null then
    raise exception 'Required existing cron job powerhouse-execution-guard-hourly not found';
  end if;
  perform cron.alter_job(v_job_id, command := 'select public.powerhouse_commercial_closed_loop_v2();');
end $$;

-- Fail closed if a future migration accidentally exposes the internal freshness control plane.
do $$
begin
  if has_table_privilege('anon','public.powerhouse_source_freshness_v1','SELECT')
     or has_table_privilege('authenticated','public.powerhouse_source_freshness_v1','SELECT') then
    raise exception 'powerhouse_source_freshness_v1 browser exposure detected';
  end if;
  if not has_table_privilege('service_role','public.powerhouse_source_freshness_v1','SELECT') then
    raise exception 'powerhouse_source_freshness_v1 service_role readback missing';
  end if;
end $$;
