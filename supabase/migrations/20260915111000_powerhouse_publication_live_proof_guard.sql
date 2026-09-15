-- Close the gap where channel delivery could appear complete while canonical
-- publication obligations still lacked live/public readback evidence.

create or replace function public.powerhouse_publication_proof_health(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
)
returns jsonb
language sql
stable
as $$
with o as (
  select
    count(*) filter (where channel in ('linkedin_personal','linkedin_company','instagram','blog'))::int as expected_count,
    count(*) filter (
      where channel in ('linkedin_personal','linkedin_company','instagram','blog')
        and status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')
    )::int as terminal_count,
    count(*) filter (
      where channel in ('linkedin_personal','linkedin_company','instagram','blog')
        and status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')
    )::int as blocking_count,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'channel',channel,
          'status',status,
          'content_id',content_id,
          'canonical_url',canonical_url,
          'last_error',last_error,
          'next_action',next_action
        ) order by channel
      ) filter (
        where channel in ('linkedin_personal','linkedin_company','instagram','blog')
          and status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')
      ),
      '[]'::jsonb
    ) as blocking
  from public.content_publication_obligations
  where tenant_id='canonical'
    and publication_date=p_run_date
)
select jsonb_build_object(
  'contract','publication-live-proof-before-daily-green-v1',
  'run_date',p_run_date,
  'expected_count',expected_count,
  'terminal_count',terminal_count,
  'blocking_count',blocking_count,
  'blocking',blocking,
  'healthy',expected_count=4 and terminal_count=4 and blocking_count=0
)
from o;
$$;

create or replace function public.powerhouse_daily_execution_guard(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
)
returns jsonb
language plpgsql
as $$
declare
  s jsonb;
  p jsonb;
  pub jsonb;
  r jsonb;
  current_state text;
  combined jsonb;
  all_ok boolean;
begin
  r := public.powerhouse_reconcile_social_delivery(p_run_date);
  s := public.powerhouse_execution_status(p_run_date);
  p := public.powerhouse_predictive_health(p_run_date);
  pub := public.powerhouse_publication_proof_health(p_run_date);

  all_ok := coalesce((s->>'execution_complete')::boolean,false)
    and coalesce((p->>'healthy')::boolean,false)
    and coalesce((pub->>'healthy')::boolean,false);

  combined := s || jsonb_build_object(
    'predictive',p,
    'publication_proof',pub,
    'social_reconciliation',r,
    'execution_complete_with_predictive',all_ok,
    'execution_complete_with_publication_proof',all_ok
  );

  select state into current_state
  from public.powerhouse_daily_runs
  where run_date=p_run_date;

  if all_ok and current_state in ('started','degraded') then
    update public.powerhouse_daily_runs
       set state='completed',
           completed_at=coalesce(completed_at,now()),
           evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
             'execution_contract','powerhouse-daily-execution-contract-v1',
             'predictive_contract','predictive-first-mover-intelligence-v1',
             'publication_contract','publication-live-proof-before-daily-green-v1',
             'execution_status',combined,
             'completion_confirmed_at',now()
           ),
           updated_at=now()
     where run_date=p_run_date;
  elsif current_state='completed' and not all_ok then
    update public.powerhouse_daily_runs
       set state='degraded',
           completed_at=null,
           evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
             'execution_contract','powerhouse-daily-execution-contract-v1',
             'predictive_contract','predictive-first-mover-intelligence-v1',
             'publication_contract','publication-live-proof-before-daily-green-v1',
             'execution_status',combined,
             'completion_reconciled_at',now()
           ),
           updated_at=now()
     where run_date=p_run_date;
  end if;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(
    now(),
    'powerhouse-daily-execution-contract',
    'execution-guard',
    case when all_ok then 'ok' else 'fout' end,
    case when all_ok
      then 'dagcyclus is execution-complete met predictive health en canonieke LIVE_PROVEN/publication proof'
      else 'dagcyclus mist delivery, predictive health of canonieke LIVE_PROVEN/publication proof; completed blijft fail-closed'
    end,
    combined
  );

  return combined;
end
$$;

insert into public.brain_failure_registry(
  fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,
  occurrence_count,version,first_seen_at,last_seen_at,evidence
)
values(
  'scheduler-green-without-public-live-proof-v1',
  'OBSERVED',
  'The daily execution guard treated canonical channel-delivery state as sufficient without also requiring the content_publication_obligations ledger to contain terminal public/live proof. A scheduler or provider path could therefore look operational while the blog remained DISPATCHED and production/Netlify readback was unavailable.',
  'Add publication-live-proof-before-daily-green-v1 to powerhouse_daily_execution_guard so four canonical publication obligations must be LIVE_PROVEN, MEASURED, LEARNED or explicitly SKIPPED before the run can become completed.',
  'Scheduler/cron success, GitHub green checks, provider acceptance, DISPATCHED and PUBLISHED are never equivalent to delivered/live. Daily green requires canonical publication-obligation readback; missing, stale, ambiguous or unavailable production evidence is fail-closed.',
  'powerhouse-publication-live-proof-guard.test.mjs|publication-live-proof-before-daily-green-v1',
  1,
  1,
  now(),
  now(),
  jsonb_build_object(
    'incident_date','2026-09-14',
    'detected_on','2026-09-15',
    'blocked_channel','blog',
    'observed_state','DISPATCHED',
    'required_state','LIVE_PROVEN',
    'production_dependency','Netlify public readback',
    'rule','scheduler green != delivery green != live proven'
  )
)
on conflict (fingerprint) do update
set root_cause=excluded.root_cause,
    proven_fix=excluded.proven_fix,
    prevention_rule=excluded.prevention_rule,
    regression_ref=excluded.regression_ref,
    last_seen_at=now(),
    evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;
