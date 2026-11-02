-- Canonical security hardening candidate: tighten the old token-gated external
-- cron recovery entry point to service_role. Existing internal pg_cron workers
-- and private reconciler are unchanged. Never introduce an anon fallback.
-- Original ONE BRAIN obligation: supabase-security|external-cron-reconcile|
-- anon-definer-rpc-advisor-warn|v1
--
-- RELEASE NOTE: requires tracing the original external caller before apply.
-- A formerly anonymous token-only caller would no longer be authorized.
begin;
do $guard$
declare
  v_oid oid;
  v_acl aclitem[];
  v_definer boolean;
begin
  select p.oid,p.proacl,p.prosecdef into v_oid,v_acl,v_definer
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='powerhouse_external_cron_reconcile_v1'
    and pg_catalog.pg_get_function_identity_arguments(p.oid)='p_token text';
  if v_oid is null or v_definer is distinct from true then
    raise exception 'ORIGINAL_EXTERNAL_CRON_RPC_IDENTITY_DRIFT';
  end if;
  if not pg_catalog.has_function_privilege('service_role',v_oid,'EXECUTE') then
    raise exception 'ORIGINAL_EXTERNAL_CRON_SERVICE_ACCESS_MISSING';
  end if;
  if pg_catalog.has_function_privilege('authenticated',v_oid,'EXECUTE') then
    raise exception 'ORIGINAL_EXTERNAL_CRON_UNEXPECTED_AUTHENTICATED_GRANT';
  end if;
end
$guard$;
revoke execute on function public.powerhouse_external_cron_reconcile_v1(text)
from PUBLIC,anon,authenticated;
grant execute on function public.powerhouse_external_cron_reconcile_v1(text) to service_role;
do $verify$
begin
 if pg_catalog.has_function_privilege('anon','public.powerhouse_external_cron_reconcile_v1(text)','EXECUTE')
    or pg_catalog.has_function_privilege('authenticated','public.powerhouse_external_cron_reconcile_v1(text)','EXECUTE')
    or not pg_catalog.has_function_privilege('service_role','public.powerhouse_external_cron_reconcile_v1(text)','EXECUTE')
 then raise exception 'EXTERNAL_CRON_RPC_ACL_READBACK_FAILED'; end if;
end $verify$;
notify pgrst, 'reload schema';
commit;
