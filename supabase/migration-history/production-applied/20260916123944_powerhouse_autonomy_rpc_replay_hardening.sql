-- Clean replay repair: the original security hardening predates the migration
-- that creates this internal control-plane function. Enforce least privilege
-- again after every historical migration has been applied.

do $$
begin
  if to_regprocedure('public.powerhouse_autonomous_growth_revenue_cycle(date)') is null then
    raise exception 'POWERHOUSE_AUTONOMY_RPC_MISSING_AFTER_REPLAY';
  end if;
end
$$;

revoke execute on function public.powerhouse_autonomous_growth_revenue_cycle(date)
  from public, anon, authenticated;
grant execute on function public.powerhouse_autonomous_growth_revenue_cycle(date)
  to service_role;
