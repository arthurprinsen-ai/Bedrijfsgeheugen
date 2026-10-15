-- P0 #4198: canonical provider social proof and freshness for a degraded day.
-- The publication and predictive safety gates are preserved unchanged.
-- Source is generated from production pg_get_functiondef readback (2026-10-15).
-- "published_social_count" denotes independently provider-verified social
-- decisions; never infer this value from a mere local 'published' state.
CREATE OR REPLACE FUNCTION public.powerhouse_execution_status(p_run_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
with d as (
  select
    count(*)::int as decision_count,
    count(*) filter (where decision='publish')::int as publish_count,
    count(*) filter (
      where decision='publish' and (
        state in ('published','measured','learned')
        or (state='scheduled' and delivery_ref is not null and scheduled_for > now())
      )
    )::int as delivered_publish_count,
    count(*) filter (
      where decision='publish' and not (
        state in ('published','measured','learned')
        or (state='scheduled' and delivery_ref is not null and scheduled_for > now())
      )
    )::int as unresolved_publish_count
  from public.powerhouse_channel_decisions
  where run_date=p_run_date
), s as (
  -- Only the canonical provider-verified social deliveries are counted.
  -- The legacy social_posts table is independent learning telemetry and can be
  -- empty even after the native LinkedIn publisher has received a valid ACK.
  -- A PUBLISHED status alone or an unverifiable provider object cannot pass.
  select count(distinct btrim(delivery_ref))::int as published_social_count
  from public.powerhouse_channel_decisions
  where run_date=p_run_date
    and decision='publish'
    and channel in ('linkedin_personal','linkedin_company','instagram_company')
    and state in ('published','measured','learned')
    and nullif(btrim(delivery_ref),'') is not null
    and coalesce((delivery_evidence->>'provider_truth_verified')::boolean,false)=true
    and (
      (channel in ('linkedin_personal','linkedin_company')
        and delivery_ref ~ '^urn:li:(share|ugcPost):[0-9]+(
  'run_date',p_run_date,
  'decision_count',d.decision_count,
  'publish_count',d.publish_count,
  'delivered_publish_count',d.delivered_publish_count,
  'unresolved_publish_count',d.unresolved_publish_count,
  'published_social_count',s.published_social_count,
  'all_channels_decided',d.decision_count=7,
  'execution_complete',d.decision_count=7 and d.unresolved_publish_count=0
)
from d cross join s;
$function$
)
      or (channel='instagram_company' and delivery_ref !~ '^[[:space:]]*(
  'run_date',p_run_date,
  'decision_count',d.decision_count,
  'publish_count',d.publish_count,
  'delivered_publish_count',d.delivered_publish_count,
  'unresolved_publish_count',d.unresolved_publish_count,
  'published_social_count',s.published_social_count,
  'all_channels_decided',d.decision_count=7,
  'execution_complete',d.decision_count=7 and d.unresolved_publish_count=0
)
from d cross join s;
$function$
)
    )
)
select jsonb_build_object(
  'run_date',p_run_date,
  'decision_count',d.decision_count,
  'publish_count',d.publish_count,
  'delivered_publish_count',d.delivered_publish_count,
  'unresolved_publish_count',d.unresolved_publish_count,
  'published_social_count',s.published_social_count,
  'all_channels_decided',d.decision_count=7,
  'execution_complete',d.decision_count=7 and d.unresolved_publish_count=0
)
from d cross join s;
$function$
;
CREATE OR REPLACE FUNCTION public.powerhouse_daily_execution_guard(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  autonomy jsonb;
  s jsonb;
  p jsonb;
  pub jsonb;
  r jsonb;
  current_state text;
  combined jsonb;
  all_ok boolean;
begin
  autonomy := public.powerhouse_autonomous_growth_revenue_cycle(p_run_date);
  r := public.powerhouse_reconcile_social_delivery(p_run_date);
  s := public.powerhouse_execution_status(p_run_date);
  p := public.powerhouse_predictive_health(p_run_date);
  pub := public.powerhouse_publication_proof_health(p_run_date);

  all_ok := coalesce((s->>'execution_complete')::boolean,false)
    and coalesce((p->>'healthy')::boolean,false)
    and coalesce((pub->>'healthy')::boolean,false)
    and coalesce((autonomy->>'healthy')::boolean,false);

  combined := s || jsonb_build_object(
    'predictive',p,
    'publication_proof',pub,
    'social_reconciliation',r,
    'autonomous_growth_revenue',autonomy,
    'execution_complete_with_predictive',all_ok,
    'execution_complete_with_publication_proof',all_ok,
    'execution_complete_with_autonomous_growth_revenue',all_ok
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
             'autonomy_contract','powerhouse-autonomous-growth-revenue-v1',
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
             'autonomy_contract','powerhouse-autonomous-growth-revenue-v1',
             'execution_status',combined,
             'completion_reconciled_at',now()
           ),
           updated_at=now()
     where run_date=p_run_date;
  elsif current_state in ('started','degraded') and not all_ok then
    -- Keep the readback snapshot fresh even when an unrelated genuine
    -- Instagram/media or predictive proof gate correctly blocks completion.
    -- Never modify state or completed_at to manufacture a green outcome.
    update public.powerhouse_daily_runs
       set evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
             'execution_contract','powerhouse-daily-execution-contract-v1',
             'predictive_contract','predictive-first-mover-intelligence-v1',
             'publication_contract','publication-live-proof-before-daily-green-v1',
             'autonomy_contract','powerhouse-autonomous-growth-revenue-v1',
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
      then 'dagcyclus is execution-complete met predictive, autonomy en canonieke LIVE_PROVEN/publication proof'
      else 'dagcyclus mist delivery, predictive health, autonomy health of canonieke LIVE_PROVEN/publication proof; completed blijft fail-closed'
    end,
    combined
  );

  return combined;
end
$function$
;
