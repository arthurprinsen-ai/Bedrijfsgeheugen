create or replace function public.powerhouse_commercial_regression_gate_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_legacy_owner_count int := 0;
  v_external_owner boolean := false;
  v_owner_count int := 0;
  v_direct_composer_owners int := 0;
  v_v2_count int := 0;
  v_terminal int := 0;
  v_missing int := 0;
  v_payload jsonb;
begin
  select count(*)::int into v_legacy_owner_count
  from cron.job
  where active
    and command ilike '%powerhouse_commercial_heartbeat_v1%';

  v_external_owner :=
    coalesce(current_setting('powerhouse.external_heartbeat_owner', true),'')
      = 'netlify-supabase-edge-v1';

  v_owner_count :=
    v_legacy_owner_count
    + case when v_external_owner then 1 else 0 end;

  select count(*)::int into v_direct_composer_owners
  from cron.job
  where active
    and (
      command ilike '%powerhouse-commercial-message-composer%'
      or command ilike '%powerhouse_dispatch_human_sales_composer_v2%'
      or command ilike '%powerhouse_one_commercial_decision_loop_v1%'
    )
    and command not ilike '%powerhouse_commercial_heartbeat_v1%';

  select count(*)::int into v_v2_count
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname in (
      'powerhouse_one_commercial_decision_loop_v2',
      'powerhouse_commercial_heartbeat_v2'
    );

  select
    count(*)::int,
    count(*) filter (
      where a.outcome_id is null
        and not exists (
          select 1
          from public.powerhouse_sales_outcomes o
          where o.action_id=a.action_id
        )
    )::int
  into v_terminal, v_missing
  from public.powerhouse_sales_actions a
  where a.created_at >= p_run_date::timestamp at time zone 'Europe/Amsterdam'
    and a.created_at < (p_run_date + 1)::timestamp at time zone 'Europe/Amsterdam'
    and a.status in ('done','expired','skipped','failed','cancelled');

  v_payload := jsonb_build_object(
    'contract','powerhouse-commercial-regression-gate-v2',
    'run_date',p_run_date,
    'canonical_scheduler_owners',v_owner_count,
    'legacy_pgcron_scheduler_owners',v_legacy_owner_count,
    'external_scheduler_owner',v_external_owner,
    'scheduler_authority',
      case
        when v_owner_count=1 and v_external_owner then 'NETLIFY_SUPABASE_EDGE'
        when v_owner_count=1 then 'LEGACY_PGCRON'
        when v_owner_count=0 then 'MISSING'
        else 'MULTIPLE'
      end,
    'direct_secondary_scheduler_owners',v_direct_composer_owners,
    'forbidden_v2_functions',v_v2_count,
    'terminal_actions',v_terminal,
    'terminal_missing_outcome',v_missing,
    'terminal_coverage_pct',
      case
        when v_terminal=0 then 100
        else round(100.0*(v_terminal-v_missing)/v_terminal,2)
      end,
    'healthy',
      v_owner_count=1
      and v_direct_composer_owners=0
      and v_v2_count=0
      and v_missing=0
  );

  insert into public.bg_gezondheid(
    gemeten_op,onderdeel,soort,status,detail,gegevens
  )
  values(
    now(),
    'powerhouse-commercial-regression-gate',
    'canonical-heartbeat-lineage',
    case when (v_payload->>'healthy')::boolean then 'ok' else 'fout' end,
    'Exactly one scheduler authority, no v2 drift, and terminal action/outcome coverage.',
    v_payload
  );

  return v_payload;
end
$function$;

revoke execute on function public.powerhouse_commercial_regression_gate_v1(date)
  from public, anon, authenticated;
grant execute on function public.powerhouse_commercial_regression_gate_v1(date)
  to service_role;

comment on function public.powerhouse_commercial_regression_gate_v1(date) is
  'Fail-closed heartbeat regression gate. Canonical scheduler authority is exactly one of legacy pg_cron or the transaction-scoped authenticated Netlify->Supabase Edge runner marker; after cutover, direct/manual DB calls remain non-authoritative.';
