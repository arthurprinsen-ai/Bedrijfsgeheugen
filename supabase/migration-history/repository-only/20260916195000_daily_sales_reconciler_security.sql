-- Close public/client execution of the privileged daily sales reconciler when present.
-- Fresh preview branches may not contain the production-only reconciler yet; absence is not
-- permission to create a weaker placeholder. If present, it remains server-only.
do $powerhouse$
begin
  if to_regprocedure('public.powerhouse_reconcile_daily_sales_action_set_v1(date)') is not null then
    execute 'revoke all on function public.powerhouse_reconcile_daily_sales_action_set_v1(date) from public, anon, authenticated';
    execute 'grant execute on function public.powerhouse_reconcile_daily_sales_action_set_v1(date) to service_role';
    execute 'comment on function public.powerhouse_reconcile_daily_sales_action_set_v1(date) is ''Privileged Powerhouse daily sales reconciliation. EXECUTE is restricted to service_role and database owners/admins; anon/authenticated/public execution is denied.''';
  end if;
end
$powerhouse$;
