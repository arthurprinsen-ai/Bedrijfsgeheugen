-- Close public/client execution of the privileged daily sales reconciler.
-- The function intentionally remains SECURITY DEFINER because it performs governed
-- service-side reconciliation across protected Powerhouse tables.

revoke all on function public.powerhouse_reconcile_daily_sales_action_set_v1(date)
from public, anon, authenticated;

grant execute on function public.powerhouse_reconcile_daily_sales_action_set_v1(date)
to service_role;

comment on function public.powerhouse_reconcile_daily_sales_action_set_v1(date) is
'Privileged Powerhouse daily sales reconciliation. SECURITY DEFINER is intentional; EXECUTE is restricted to service_role and database owners/admins. anon/authenticated/public execution is denied.';
