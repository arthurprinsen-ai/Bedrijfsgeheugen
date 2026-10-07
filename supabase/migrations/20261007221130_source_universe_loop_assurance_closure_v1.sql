-- Source Universe Loop Assurance closure v1
-- Closes evidence stages without fabricating actions, outcomes, money or learning.
-- Reuses the existing Source Universe runtime event and Loop Assurance authority.

create or replace function public.powerhouse_sync_external_intelligence_assurance_receipts_v1(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_event public.powerhouse_runtime_events%rowtype;
  v_materialized integer := 0;
  v_verified_outcomes integer := 0;
  v_action_candidates integer := 0;
  v_table_guard_ok boolean := false;
  v_function_guard_ok boolean := false;
  v_truth_guard_ok boolean := false;
  v_guard_ok boolean := false;
  v_written integer := 0;
begin
  select e.*
    into v_event
  from public.powerhouse_runtime_events e
  where e.source='powerhouse-external-intelligence-universe-v1'
    and e.event_type='external_intelligence_universe_refresh'
  order by e.occurred_at desc,e.updated_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'contract','powerhouse-source-universe-loop-assurance-closure-v1',
      'status','NO_RUNTIME_EVENT',
      'receipts_written',0,
      'guard_ok',false,
      'executed_at',p_now
    );
  end if;

  v_materialized:=coalesce(nullif(v_event.context->>'canonical_actions_materialized','')::integer,0);
  v_verified_outcomes:=coalesce(nullif(v_event.context->>'verified_outcomes_linked','')::integer,0);
  v_action_candidates:=coalesce(
    nullif(v_event.context->>'action_candidates','')::integer,
    nullif(v_event.evidence->>'action_candidate_count','')::integer,
    0
  );

  -- Action stage means the action gate was evaluated. Zero materialization is valid evidence
  -- when company-specific scored impact is unavailable; it is never promoted to a fake action.
  insert into public.powerhouse_loop_assurance_receipts_v1(
    loop_key,stage,observed_at,evidence,updated_at
  )
  values(
    'external-intelligence-universe',
    'action',
    v_event.occurred_at,
    jsonb_build_object(
      'evidence_type','action_stage_readback',
      'status',case when v_materialized>0 then 'MATERIALIZED'
                    else 'NO_MATERIALIZATION_TRUTH_GATED' end,
      'action_candidates',v_action_candidates,
      'canonical_actions_materialized',v_materialized,
      'business_action_fabricated',false,
      'reason',case when v_materialized>0
                    then 'canonical action authority materialized one or more actions'
                    else 'no tenant-specific scored impact produced a ready canonical action' end
    ),
    p_now
  )
  on conflict(loop_key,stage) do update
    set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
  where public.powerhouse_loop_assurance_receipts_v1.observed_at<=excluded.observed_at;
  v_written:=v_written+1;

  -- Outcome stage means verified outcome authority was checked. Absence remains explicit absence.
  insert into public.powerhouse_loop_assurance_receipts_v1(
    loop_key,stage,observed_at,evidence,updated_at
  )
  values(
    'external-intelligence-universe',
    'outcome',
    v_event.occurred_at,
    jsonb_build_object(
      'evidence_type','outcome_stage_readback',
      'status',case when v_verified_outcomes>0 then 'VERIFIED_OUTCOME_LINKED'
                    else 'NO_VERIFIED_OUTCOME_OBSERVED' end,
      'verified_outcomes_linked',v_verified_outcomes,
      'outcome_synthesized',false,
      'fulfilled_obligation_is_business_outcome',false
    ),
    p_now
  )
  on conflict(loop_key,stage) do update
    set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
  where public.powerhouse_loop_assurance_receipts_v1.observed_at<=excluded.observed_at;
  v_written:=v_written+1;

  -- Learning stage records the canonical learning decision, including a legitimate no-op.
  insert into public.powerhouse_loop_assurance_receipts_v1(
    loop_key,stage,observed_at,evidence,updated_at
  )
  values(
    'external-intelligence-universe',
    'learning',
    v_event.occurred_at,
    jsonb_build_object(
      'evidence_type','learning_stage_readback',
      'status',case when v_verified_outcomes>0 then 'VERIFIED_OUTCOME_AVAILABLE_TO_LEARNING'
                    else 'NO_NEW_VERIFIED_OUTCOME_TO_LEARN' end,
      'learning_authority','powerhouse_run_daily_compound_learning_v1',
      'eligible_verified_outcomes',v_verified_outcomes,
      'learning_synthesized',false
    ),
    p_now
  )
  on conflict(loop_key,stage) do update
    set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
  where public.powerhouse_loop_assurance_receipts_v1.observed_at<=excluded.observed_at;
  v_written:=v_written+1;

  -- Guard is fresh only when every server-only and truth boundary is actually true.
  select count(*)=7
         and coalesce(bool_and(
           c.relrowsecurity
           and not has_table_privilege('anon',format('public.%I',c.relname),'SELECT')
           and not has_table_privilege('authenticated',format('public.%I',c.relname),'SELECT')
           and has_table_privilege('service_role',format('public.%I',c.relname),'SELECT')
         ),false)
    into v_table_guard_ok
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relname=any(array[
      'powerhouse_intelligence_domain_registry_v1',
      'powerhouse_intelligence_source_catalog_v1',
      'powerhouse_intelligence_signal_projection_v1',
      'powerhouse_intelligence_signal_relation_v1',
      'powerhouse_intelligence_company_impact_v1',
      'powerhouse_intelligence_action_candidate_v1',
      'powerhouse_intelligence_snapshot_v1'
    ]::text[]);

  select count(*)>=6
         and coalesce(bool_and(
           p.prosecdef
           and not has_function_privilege('anon',p.oid,'EXECUTE')
           and not has_function_privilege('authenticated',p.oid,'EXECUTE')
           and has_function_privilege('service_role',p.oid,'EXECUTE')
           and coalesce(array_to_string(p.proconfig,','),'') like '%search_path=public, pg_catalog%'
         ),false)
    into v_function_guard_ok
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname=any(array[
      'powerhouse_refresh_external_intelligence_universe_v1',
      'powerhouse_upsert_intelligence_company_impact_v1',
      'powerhouse_materialize_intelligence_action_v1',
      'powerhouse_reconcile_intelligence_outcomes_v1',
      'powerhouse_project_internal_evidence_signal_v1',
      'powerhouse_refresh_signal_relations_v1'
    ]::text[]);

  v_truth_guard_ok:=
    coalesce((v_event.evidence#>>'{evidence,unknown_never_green}')::boolean,false)
    and coalesce((v_event.evidence#>>'{evidence,money_values_require_evidence}')::boolean,false);

  v_guard_ok:=v_table_guard_ok and v_function_guard_ok and v_truth_guard_ok;

  if v_guard_ok then
    insert into public.powerhouse_loop_assurance_receipts_v1(
      loop_key,stage,observed_at,evidence,updated_at
    )
    values(
      'external-intelligence-universe',
      'guard',
      v_event.occurred_at,
      jsonb_build_object(
        'evidence_type','truth_and_security_guard_readback',
        'status','PASS',
        'rls_and_browser_revokes',v_table_guard_ok,
        'privileged_function_boundary',v_function_guard_ok,
        'truth_policy',v_truth_guard_ok,
        'money_values_require_evidence',true,
        'unknown_never_green',true
      ),
      p_now
    )
    on conflict(loop_key,stage) do update
      set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
    where public.powerhouse_loop_assurance_receipts_v1.observed_at<=excluded.observed_at;
    v_written:=v_written+1;
  else
    -- Never leave a previously fresh PASS receipt behind after a guard regression.
    delete from public.powerhouse_loop_assurance_receipts_v1
    where loop_key='external-intelligence-universe' and stage='guard';
  end if;

  return jsonb_build_object(
    'contract','powerhouse-source-universe-loop-assurance-closure-v1',
    'status',case when v_guard_ok then 'EVIDENCED' else 'GUARD_FAILED' end,
    'event_occurred_at',v_event.occurred_at,
    'action_candidates',v_action_candidates,
    'canonical_actions_materialized',v_materialized,
    'verified_outcomes_linked',v_verified_outcomes,
    'guard_ok',v_guard_ok,
    'table_guard_ok',v_table_guard_ok,
    'function_guard_ok',v_function_guard_ok,
    'truth_guard_ok',v_truth_guard_ok,
    'receipts_written',v_written,
    'executed_at',p_now
  );
end
$$;

create or replace function public.powerhouse_external_intelligence_assurance_receipt_trigger_v1()
returns trigger
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
begin
  perform public.powerhouse_sync_external_intelligence_assurance_receipts_v1(now());
  return new;
end
$$;

drop trigger if exists powerhouse_external_intelligence_assurance_receipt_v1
  on public.powerhouse_runtime_events;

create trigger powerhouse_external_intelligence_assurance_receipt_v1
after insert or update on public.powerhouse_runtime_events
for each row
when (
  new.source='powerhouse-external-intelligence-universe-v1'
  and new.event_type='external_intelligence_universe_refresh'
)
execute function public.powerhouse_external_intelligence_assurance_receipt_trigger_v1();

update public.powerhouse_loop_assurance_registry_v1
set evidence_contract=evidence_contract||jsonb_build_object(
      'action','explicit action-stage readback; zero materialization is valid only when truth gates block canonical action',
      'outcome','verified outcome authority readback; zero verified outcomes remains explicit zero',
      'learning','canonical learning decision; no verified outcome means a truthful no-op',
      'guard','fresh only when RLS, browser revokes, privileged function boundaries and truth flags all pass'
    ),
    updated_at=now()
where loop_key='external-intelligence-universe';

-- Backfill the latest already-proven runtime event without inventing any new signal/action/outcome.
select public.powerhouse_sync_external_intelligence_assurance_receipts_v1(now());

revoke all on function public.powerhouse_sync_external_intelligence_assurance_receipts_v1(timestamptz)
  from public,anon,authenticated;
grant execute on function public.powerhouse_sync_external_intelligence_assurance_receipts_v1(timestamptz)
  to service_role;

revoke all on function public.powerhouse_external_intelligence_assurance_receipt_trigger_v1()
  from public,anon,authenticated;

comment on function public.powerhouse_sync_external_intelligence_assurance_receipts_v1(timestamptz)
is 'Writes truthful Source Universe assurance receipts, including explicit no-op action/outcome/learning evidence; guard exists only when security and truth boundaries pass.';
