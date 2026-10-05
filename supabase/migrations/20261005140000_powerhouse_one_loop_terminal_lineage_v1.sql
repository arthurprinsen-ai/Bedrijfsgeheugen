-- Powerhouse One Loop Terminal Lineage v1
-- Canonicalises commercial loop ownership without inventing business outcomes.
-- One loop: signal -> intelligence -> decision -> action -> execution -> outcome obligation -> observed outcome -> learning.

-- 1. Legacy commercial closed-loop versions remain compatibility aliases only.
-- They may not contain independent business logic.
create or replace function public.powerhouse_commercial_closed_loop_v2(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select public.powerhouse_one_commercial_closed_loop_v1(p_run_date);
$$;

create or replace function public.powerhouse_commercial_closed_loop_v3(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select public.powerhouse_one_commercial_closed_loop_v1(p_run_date);
$$;

create or replace function public.powerhouse_commercial_closed_loop_v4(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select public.powerhouse_one_commercial_closed_loop_v1(p_run_date);
$$;

create or replace function public.powerhouse_commercial_closed_loop_v5(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select public.powerhouse_one_commercial_closed_loop_v1(p_run_date);
$$;

create or replace function public.powerhouse_commercial_closed_loop_v6(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select public.powerhouse_one_commercial_closed_loop_v1(p_run_date);
$$;

revoke execute on function public.powerhouse_commercial_closed_loop_v2(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_commercial_closed_loop_v3(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_commercial_closed_loop_v4(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_commercial_closed_loop_v5(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_commercial_closed_loop_v6(date) from public, anon, authenticated;
grant execute on function public.powerhouse_commercial_closed_loop_v2(date) to service_role;
grant execute on function public.powerhouse_commercial_closed_loop_v3(date) to service_role;
grant execute on function public.powerhouse_commercial_closed_loop_v4(date) to service_role;
grant execute on function public.powerhouse_commercial_closed_loop_v5(date) to service_role;
grant execute on function public.powerhouse_commercial_closed_loop_v6(date) to service_role;

comment on function public.powerhouse_commercial_closed_loop_v2(date) is 'Compatibility alias only. Canonical owner: powerhouse_one_commercial_closed_loop_v1.';
comment on function public.powerhouse_commercial_closed_loop_v3(date) is 'Compatibility alias only. Canonical owner: powerhouse_one_commercial_closed_loop_v1.';
comment on function public.powerhouse_commercial_closed_loop_v4(date) is 'Compatibility alias only. Canonical owner: powerhouse_one_commercial_closed_loop_v1.';
comment on function public.powerhouse_commercial_closed_loop_v5(date) is 'Compatibility alias only. Canonical owner: powerhouse_one_commercial_closed_loop_v1.';
comment on function public.powerhouse_commercial_closed_loop_v6(date) is 'Compatibility alias only. Canonical owner: powerhouse_one_commercial_closed_loop_v1.';

-- 2. Every terminal action must carry explicit lineage.
-- This is lifecycle evidence, not a fabricated observed business outcome.
create or replace function public.powerhouse_sales_action_terminal_lineage_guard_v1()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_terminal boolean;
  v_internal boolean;
  v_outcome_state text;
  v_obligation text;
begin
  v_terminal := new.status in ('done','expired','skipped','failed','cancelled');
  if not v_terminal then
    return new;
  end if;

  v_internal := lower(coalesce(new.channel,'')) in ('internal','internal_research')
                or new.action_type='research_enrichment';

  if new.outcome_id is not null then
    v_outcome_state := 'OBSERVED';
    v_obligation := 'CLOSED';
  elsif v_internal or new.status in ('expired','skipped','failed','cancelled') then
    v_outcome_state := 'NOT_APPLICABLE';
    v_obligation := 'CLOSED';
  else
    v_outcome_state := 'PENDING_OBSERVATION';
    v_obligation := 'OPEN';
  end if;

  new.evidence := coalesce(new.evidence,'{}'::jsonb)
    || jsonb_build_object(
      'terminal_lineage',
      jsonb_build_object(
        'contract','powerhouse-one-loop-terminal-lineage-v1',
        'action_terminal',true,
        'action_status',new.status,
        'business_outcome_state',v_outcome_state,
        'outcome_obligation',v_obligation,
        'observed_business_outcome',new.outcome_id is not null,
        'recorded_at',now(),
        'truth_rule','Lifecycle closure is not an observed business outcome. Revenue/outcome truth still requires explicit observed evidence.'
      )
    );
  return new;
end
$$;

drop trigger if exists trg_powerhouse_sales_action_terminal_lineage_v1
on public.powerhouse_sales_actions;

create trigger trg_powerhouse_sales_action_terminal_lineage_v1
before insert or update of status, outcome_id
on public.powerhouse_sales_actions
for each row
execute function public.powerhouse_sales_action_terminal_lineage_guard_v1();

-- Backfill existing terminal lifecycle state without synthesising business outcomes.
update public.powerhouse_sales_actions a
set evidence = coalesce(a.evidence,'{}'::jsonb)
  || jsonb_build_object(
    'terminal_lineage',
    jsonb_build_object(
      'contract','powerhouse-one-loop-terminal-lineage-v1',
      'action_terminal',true,
      'action_status',a.status,
      'business_outcome_state',
        case
          when a.outcome_id is not null then 'OBSERVED'
          when lower(coalesce(a.channel,'')) in ('internal','internal_research')
               or a.action_type='research_enrichment'
               or a.status in ('expired','skipped','failed','cancelled')
            then 'NOT_APPLICABLE'
          else 'PENDING_OBSERVATION'
        end,
      'outcome_obligation',
        case
          when a.outcome_id is not null
               or lower(coalesce(a.channel,'')) in ('internal','internal_research')
               or a.action_type='research_enrichment'
               or a.status in ('expired','skipped','failed','cancelled')
            then 'CLOSED'
          else 'OPEN'
        end,
      'observed_business_outcome',a.outcome_id is not null,
      'recorded_at',now(),
      'truth_rule','Lifecycle closure is not an observed business outcome. Revenue/outcome truth still requires explicit observed evidence.'
    )
  ),
  updated_at = now()
where a.status in ('done','expired','skipped','failed','cancelled')
  and not (coalesce(a.evidence,'{}'::jsonb) ? 'terminal_lineage');

create or replace view public.powerhouse_action_terminal_lineage_v1
with (security_invoker=true) as
select
  a.action_id,
  a.subject_key,
  a.person_key,
  a.company_key,
  a.action_type,
  a.channel,
  a.status,
  a.created_at,
  a.executed_at,
  a.outcome_id,
  (a.outcome_id is not null) as observed_business_outcome,
  coalesce((a.evidence#>>'{terminal_lineage,action_terminal}')::boolean,false) as action_terminal,
  coalesce(a.evidence#>>'{terminal_lineage,business_outcome_state}',
           case when a.outcome_id is not null then 'OBSERVED' else 'UNACCOUNTED' end) as business_outcome_state,
  coalesce(a.evidence#>>'{terminal_lineage,outcome_obligation}',
           case when a.outcome_id is not null then 'CLOSED' else 'UNACCOUNTED' end) as outcome_obligation,
  (
    a.outcome_id is not null
    or coalesce((a.evidence#>>'{terminal_lineage,action_terminal}')::boolean,false)
  ) as lineage_accounted_for
from public.powerhouse_sales_actions a;

revoke all on table public.powerhouse_action_terminal_lineage_v1 from public, anon, authenticated;
grant select on table public.powerhouse_action_terminal_lineage_v1 to service_role;

-- 3. Runtime regression gate: one scheduler owner, no active split-stage owners,
-- compatibility aliases only, and no terminal action may be unaccounted.
create or replace function public.powerhouse_one_loop_regression_gate_v1(
  p_record_health boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_owner_count int:=0;
  v_split_owner_count int:=0;
  v_bad_legacy_count int:=0;
  v_unaccounted_terminal int:=0;
  v_open_observed_outcome_obligations int:=0;
  v_payload jsonb;
begin
  select count(*)::int into v_owner_count
  from cron.job
  where active
    and (
      jobname='powerhouse-one-commercial-loop-daily-v1'
      or command ilike '%powerhouse_one_commercial_decision_loop_v1(%'
      or command ilike '%powerhouse_one_commercial_closed_loop_v1(%'
      or command ~* 'powerhouse_commercial_closed_loop_v[2-9][0-9]*[[:space:]]*\\('
    );

  select count(*)::int into v_split_owner_count
  from cron.job
  where active
    and jobname in (
      'powerhouse-commercial-context-daily-v1',
      'powerhouse-commercial-actions-daily-v1'
    );

  select count(*)::int into v_bad_legacy_count
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname in ('powerhouse_commercial_closed_loop_v2','powerhouse_commercial_closed_loop_v3','powerhouse_commercial_closed_loop_v4','powerhouse_commercial_closed_loop_v5','powerhouse_commercial_closed_loop_v6')
    and position('powerhouse_one_commercial_closed_loop_v1' in p.prosrc)=0;

  select count(*)::int into v_unaccounted_terminal
  from public.powerhouse_sales_actions a
  where a.status in ('done','expired','skipped','failed','cancelled')
    and a.outcome_id is null
    and not coalesce((a.evidence#>>'{terminal_lineage,action_terminal}')::boolean,false);

  select count(*)::int into v_open_observed_outcome_obligations
  from public.powerhouse_sales_actions a
  where a.status='done'
    and a.outcome_id is null
    and coalesce(a.evidence#>>'{terminal_lineage,outcome_obligation}','UNACCOUNTED')='OPEN';

  v_payload:=jsonb_build_object(
    'contract','powerhouse-one-loop-regression-gate-v1',
    'healthy',v_owner_count=1 and v_split_owner_count=0 and v_bad_legacy_count=0 and v_unaccounted_terminal=0,
    'canonical_scheduler_owner_count',v_owner_count,
    'active_split_stage_scheduler_count',v_split_owner_count,
    'non_alias_legacy_loop_count',v_bad_legacy_count,
    'unaccounted_terminal_action_count',v_unaccounted_terminal,
    'open_observed_outcome_obligations',v_open_observed_outcome_obligations,
    'truth_rule','Open observed-outcome obligations are visible work, not falsely green outcomes.',
    'checked_at',now()
  );

  if p_record_health then
    insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    values(
      now(),
      'powerhouse-one-loop-regression',
      'canonical-lineage',
      case when (v_payload->>'healthy')::boolean then 'ok' else 'fout' end,
      'One-loop scheduler, alias and terminal-lineage regression gate.',
      v_payload
    );
  end if;

  return v_payload;
end
$$;

revoke execute on function public.powerhouse_one_loop_regression_gate_v1(boolean) from public, anon, authenticated;
grant execute on function public.powerhouse_one_loop_regression_gate_v1(boolean) to service_role;

-- 4. Canonicalise the one scheduler owner. Components may keep their own bounded
-- provider/maintenance schedules; only the full commercial decision loop has one owner.
do $$
declare r record;
begin
  for r in
    select jobid
    from cron.job
    where jobname in (
      'powerhouse-sales-machine-daily-v6',
      'powerhouse-one-commercial-loop-daily-v1'
    )
       or (
         command ~* 'powerhouse_commercial_closed_loop_v[2-9][0-9]*[[:space:]]*\\('
       )
  loop
    perform cron.unschedule(r.jobid);
  end loop;
end
$$;

select cron.schedule(
  'powerhouse-one-commercial-loop-daily-v1',
  '35 6 * * *',
  $cron$
    select public.powerhouse_one_commercial_decision_loop_v1((now() at time zone 'Europe/Amsterdam')::date);
    select public.powerhouse_one_loop_regression_gate_v1(true);
  $cron$
);

-- Keep split-stage legacy owners explicitly disabled if they still exist.
update cron.job
set active=false
where jobname in (
  'powerhouse-commercial-context-daily-v1',
  'powerhouse-commercial-actions-daily-v1'
);

-- 5. Initial readback is persisted through the existing health spine.
select public.powerhouse_one_loop_regression_gate_v1(true);
