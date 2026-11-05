-- Forecasts stayed 'active' after their own horizon. 3,826 were stale on 2026-11-05 and the
-- recommendation generator kept turning the expired CPNL forecast ("opens 6 Oct 2026") into daily
-- blogs that the reader-ready gate then had to block. Expire them hourly; touch nothing else.
create or replace function public.powerhouse_expire_stale_forecasts_v1(p_today date default (now() at time zone 'Europe/Amsterdam')::date)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_count integer;
begin
  update public.powerhouse_forecasts
     set status = 'expired',
         updated_at = now()
   where status in ('active', 'claimed')
     and coalesce(expected_by, horizon_end) is not null
     and coalesce(expected_by, horizon_end) < p_today;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.powerhouse_expire_stale_forecasts_v1(date) from public, anon, authenticated;

do $$ begin
  if exists (select 1 from cron.job where jobname = 'powerhouse-forecast-expiry-v1') then
    perform cron.unschedule('powerhouse-forecast-expiry-v1');
  end if;
end $$;

select cron.schedule('powerhouse-forecast-expiry-v1', '5 * * * *', $cmd$
select public.powerhouse_expire_stale_forecasts_v1();
$cmd$);
