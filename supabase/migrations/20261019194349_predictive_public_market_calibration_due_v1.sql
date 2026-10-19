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
