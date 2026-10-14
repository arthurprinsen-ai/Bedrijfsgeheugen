-- Must be applied through authorized Supabase migration before activating Netlify schedule.
-- Private queue remains unexposed. Only service_role may call this narrow RPC.
create or replace function public.powerhouse_external_cron_reconcile_v1()
returns integer language plpgsql security definer
set search_path=pg_catalog,public,powerhouse_ops as $body$
begin
  if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' then
    raise exception 'forbidden' using errcode='42501';
  end if;
  perform set_config('statement_timeout','15000',true);
  return powerhouse_ops.reconcile_cron_failures(interval '20 minutes',50);
end;
$body$;
revoke all on function public.powerhouse_external_cron_reconcile_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_external_cron_reconcile_v1() to service_role;
