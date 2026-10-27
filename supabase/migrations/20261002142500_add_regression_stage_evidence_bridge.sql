
create or replace function public.powerhouse_refresh_regression_stage_evidence_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_e jsonb;
  v_pass boolean;
  v_state text;
  v_count bigint;
  v_written integer := 0;
  s text;
begin
  -- daily compound learning: actual runtime result is the evidence.
  select e.evidence into v_e
  from public.powerhouse_runtime_events e
  where e.source='powerhouse-daily-compound-learning-v1'
    and e.occurred_at >= p_now-interval '48 hours'
  order by e.occurred_at desc limit 1;
  if v_e is not null then
    v_pass := coalesce((v_e#>>'{control,forecast_resolution_debt}')::int,0)=0;
    foreach s in array array['outcome','learning','guard'] loop
      perform public.powerhouse_record_loop_stage_v1('daily-compound-learning',s,
        jsonb_build_object('contract','powerhouse-daily-compound-learning-v1','pass',case when s='guard' then v_pass else null end,'runtime_evidence',v_e),p_now);
      v_written:=v_written+1;
    end loop;
  end if;

  -- self improvement: evidence-backed control result, no invented learning.
  select e.evidence into v_e
  from public.powerhouse_runtime_events e
  where e.source='powerhouse-self-improvement-layer.v1'
    and e.occurred_at >= p_now-interval '48 hours'
  order by e.occurred_at desc limit 1;
  if v_e is not null then
    v_pass := coalesce((v_e#>>'{self_improvement_control,model_health_unknown}')::int,0)=0
      and coalesce((v_e#>>'{self_improvement_control,compiler_regression_pending}')::int,0)=0
      and coalesce((v_e#>>'{self_improvement_control,escaped_defects_without_regression}')::int,0)=0;
    foreach s in array array['outcome','learning','guard'] loop
      perform public.powerhouse_record_loop_stage_v1('self-improvement-layer',s,
        jsonb_build_object('contract','powerhouse-self-improvement-layer.v1','pass',case when s='guard' then v_pass else null end,'runtime_evidence',v_e),p_now);
      v_written:=v_written+1;
    end loop;
  end if;

  -- data spine: verified no-op is a valid action when no repair is required.
  select count(*) into v_count
  from public.powerhouse_data_spine_health_v1
  where operational_state<>'HEALTHY';
  v_pass := v_count=0;
  foreach s in array array['action','outcome','learning','guard'] loop
    perform public.powerhouse_record_loop_stage_v1('data-spine-watchdog',s,
      jsonb_build_object('contract','powerhouse-unified-data-intelligence-spine-v1',
        'pass',case when s='guard' then v_pass else null end,
        'unhealthy_sources',v_count,
        'action_kind',case when s='action' and v_pass then 'VERIFIED_NO_OP' else 'OBSERVED' end),p_now);
    v_written:=v_written+1;
  end loop;

  -- execution resilience: only green when no stale unreconciled operation remains.
  select count(*) into v_count
  from public.brain_operations o
  where o.status in ('PLANNED','DISPATCHED','RESULT_UNKNOWN')
    and o.evidence ? 'execution_resilience'
    and coalesce((o.evidence->'execution_resilience'->>'recovery_required')::boolean,false)=false
    and coalesce(nullif(o.evidence->'execution_resilience'->>'last_heartbeat_at','')::timestamptz,o.updated_at) < p_now-interval '120 seconds';
  v_pass := v_count=0;
  foreach s in array array['action','readback','outcome','measurement','learning','guard'] loop
    perform public.powerhouse_record_loop_stage_v1('execution-resilience',s,
      jsonb_build_object('contract','powerhouse-execution-resilience-v1',
        'pass',case when s='guard' then v_pass else null end,
        'stale_unreconciled_operations',v_count,
        'action_kind',case when s='action' and v_pass then 'VERIFIED_NO_OP' else 'RECOVERY_REQUIRED' end),p_now);
    v_written:=v_written+1;
  end loop;

  -- full cycle: result itself determines guard truth.
  select e.evidence into v_e
  from public.powerhouse_runtime_events e
  where e.source='powerhouse_full_cycle_production_proof'
    and e.subject_key=v_date::text
  order by e.occurred_at desc limit 1;
  if v_e is not null then
    v_pass := coalesce((v_e->>'healthy')::boolean,false);
    foreach s in array array['action','outcome','learning','guard'] loop
      perform public.powerhouse_record_loop_stage_v1('full-cycle-production-proof',s,
        jsonb_build_object('contract','powerhouse-full-cycle-production-proof-v1','pass',case when s='guard' then v_pass else null end,'proof',v_e),p_now);
      v_written:=v_written+1;
    end loop;
  end if;

  -- one brain: actual health projection controls truth.
  select to_jsonb(h),h.architecture_state into v_e,v_state
  from public.powerhouse_one_brain_runtime_health_v1 h limit 1;
  if v_e is not null then
    v_pass := v_state='GREEN' and coalesce(v_e->>'learning_state','')='EVIDENCE_CURRENT';
    foreach s in array array['action','readback','outcome','measurement','learning','guard'] loop
      perform public.powerhouse_record_loop_stage_v1('one-brain-reconcile',s,
        jsonb_build_object('contract','powerhouse-one-brain-runtime-v1','pass',case when s='guard' then v_pass else null end,'health',v_e),p_now);
      v_written:=v_written+1;
    end loop;
  end if;

  -- revenue flywheel.
  select to_jsonb(f) into v_e from public.powerhouse_revenue_flywheel_v1 f limit 1;
  if v_e is not null then
    v_pass := not coalesce((v_e->>'outcome_gap')::boolean,false)
      and not coalesce((v_e->>'calibration_gap')::boolean,false)
      and not coalesce((v_e->>'experiment_decision_gap')::boolean,false);
    foreach s in array array['action','outcome','learning','guard'] loop
      perform public.powerhouse_record_loop_stage_v1('revenue-flywheel',s,
        jsonb_build_object('contract','powerhouse-revenue-flywheel-v1','pass',case when s='guard' then v_pass else null end,'health',v_e),p_now);
      v_written:=v_written+1;
    end loop;
  end if;

  -- content closed-loop. IN_PROGRESS/BLOCKED is explicitly not green.
  select jsonb_build_object('status',b.status,'verified',b.verified,'result',b.result),b.status
  into v_e,v_state
  from public.brain_records b
  where b.tenant_id='canonical' and b.record_id='content-closed-loop:'||v_date::text
  order by b.updated_at desc limit 1;
  if v_e is not null then
    v_pass := v_state='VERIFIED' and coalesce((v_e->>'verified')::boolean,false);
    foreach s in array array['action','readback','outcome','measurement','learning','guard'] loop
      perform public.powerhouse_record_loop_stage_v1('content-closed-loop',s,
        jsonb_build_object('contract','powerhouse-content-closed-loop-v1','pass',case when s='guard' then v_pass else null end,'state',v_e),p_now);
      v_written:=v_written+1;
    end loop;
  end if;

  -- SEO resolver: only use fresh canonical intelligence written today.
  select count(*) into v_count
  from public.powerhouse_seo_keyword_intelligence_v1
  where observed_at >= date_trunc('day',p_now at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam';
  v_pass := v_count>0;
  foreach s in array array['action','readback','outcome','measurement','learning','guard'] loop
    perform public.powerhouse_record_loop_stage_v1('seo-opportunity-resolver',s,
      jsonb_build_object('contract','powerhouse-seo-opportunity-resolver-v1',
        'pass',case when s='guard' then v_pass else null end,'fresh_keyword_rows',v_count),p_now);
    v_written:=v_written+1;
  end loop;

  -- Mira problem radar: fresh observed source signals are the canonical output.
  select count(*) into v_count
  from public.powerhouse_mira_problem_signals_v1
  where updated_at >= date_trunc('day',p_now at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam';
  v_pass := v_count>0;
  foreach s in array array['action','readback','outcome','measurement','learning','guard'] loop
    perform public.powerhouse_record_loop_stage_v1('mira-problem-loop',s,
      jsonb_build_object('contract','powerhouse-mira-problem-radar-v1',
        'pass',case when s='guard' then v_pass else null end,'fresh_problem_rows',v_count),p_now);
    v_written:=v_written+1;
  end loop;

  return jsonb_build_object('ok',true,'written',v_written,'refreshed_at',p_now,'truth','evidence-backed stages only; no synthetic outcome or revenue');
end;
$function$;
