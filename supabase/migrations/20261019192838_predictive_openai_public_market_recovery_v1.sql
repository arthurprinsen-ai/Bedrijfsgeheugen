-- User-directed provider replacement for the existing public-market use case only.
-- Keep approval, lifecycle, tenant scope, data categories and review controls unchanged.
update public.brain_ai_governance_registry
set provider='OpenAI',model_id='gpt-5-mini',model_revision='gpt-5-mini',
    inference_platform='OpenAI Responses API',
    provider_evidence_urls=ARRAY['https://developers.openai.com/api/docs/models/gpt-5-mini','https://developers.openai.com/api/docs/guides/function-calling'],
    evidence_ids=array(select distinct value from unnest(coalesce(evidence_ids,ARRAY[]::text[])||ARRAY['predictive-openai-recovery-20261019']) value),
    updated_at=now()
where tenant_id='canonical' and use_case_id='supabase-powerhouse-predictive-first-mover-v1'
  and approved=true and lifecycle_status='ACTIVE'
  and provider in ('Anthropic','OpenAI');

-- Existing queue projection only: choose public scopes BEFORE the bounded batch.
-- Person/customer predictions must neither cross the provider boundary nor starve
-- the independently authorized public-market calibration workload.
create or replace function public.powerhouse_public_market_calibration_due_v1(p_limit integer default 12)
returns setof public.revenue_learning_obligations
language sql stable security invoker
set search_path=pg_catalog,public
as $function$
  select o.*
  from public.revenue_learning_obligations o
  join public.powerhouse_forecasts f on f.forecast_id::text=o.payload->>'forecast_id'
  where o.tenant_id='canonical' and o.type='FORECAST_CALIBRATION'
    and o.status='OPEN' and o.due_at<=now()
    and f.scope in ('segment','market','technology','regulation','behavior')
  order by o.due_at,o.obligation_id
  limit greatest(1,least(coalesce(p_limit,12),12));
$function$;
revoke all on function public.powerhouse_public_market_calibration_due_v1(integer) from public,anon,authenticated;
grant execute on function public.powerhouse_public_market_calibration_due_v1(integer) to service_role;
