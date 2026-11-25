-- Powerhouse Security & Operations Hardening v1
-- Extends the existing public RLS guard with classification/readback only.
-- It intentionally does NOT create tenant/user policies and does NOT drop indexes.

create or replace view public.powerhouse_public_rls_policy_classification_v1
with (security_invoker = true)
as
select
  n.nspname as table_schema,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  (
    select count(*)::integer
    from pg_catalog.pg_policy p
    where p.polrelid = c.oid
  ) as policy_count,
  (
    pg_catalog.has_table_privilege('anon', c.oid, 'SELECT')
    or pg_catalog.has_table_privilege('anon', c.oid, 'INSERT')
    or pg_catalog.has_table_privilege('anon', c.oid, 'UPDATE')
    or pg_catalog.has_table_privilege('anon', c.oid, 'DELETE')
  ) as anon_has_client_dml,
  (
    pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', c.oid, 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', c.oid, 'UPDATE')
    or pg_catalog.has_table_privilege('authenticated', c.oid, 'DELETE')
  ) as authenticated_has_client_dml,
  case
    when not c.relrowsecurity then 'RLS_DISABLED'
    when not exists (select 1 from pg_catalog.pg_policy p where p.polrelid = c.oid)
      and not (
        pg_catalog.has_table_privilege('anon', c.oid, 'SELECT')
        or pg_catalog.has_table_privilege('anon', c.oid, 'INSERT')
        or pg_catalog.has_table_privilege('anon', c.oid, 'UPDATE')
        or pg_catalog.has_table_privilege('anon', c.oid, 'DELETE')
        or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT')
        or pg_catalog.has_table_privilege('authenticated', c.oid, 'INSERT')
        or pg_catalog.has_table_privilege('authenticated', c.oid, 'UPDATE')
        or pg_catalog.has_table_privilege('authenticated', c.oid, 'DELETE')
      ) then 'INTENTIONAL_DENY_ALL_CLIENTS'
    when not exists (select 1 from pg_catalog.pg_policy p where p.polrelid = c.oid)
      then 'POLICY_REQUIRED'
    else 'POLICY_PRESENT'
  end as classification
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p');

comment on view public.powerhouse_public_rls_policy_classification_v1 is
'Canonical Powerhouse readback for public-table RLS intent. POLICY_REQUIRED means client DML privilege exists while no RLS policy exists. INTENTIONAL_DENY_ALL_CLIENTS means RLS is enabled, no policy exists, and anon/authenticated have no direct DML privilege. The view never mutates grants or policies.';

revoke all on public.powerhouse_public_rls_policy_classification_v1 from public, anon, authenticated;
grant select on public.powerhouse_public_rls_policy_classification_v1 to service_role;

create or replace function public.powerhouse_public_rls_policy_audit_v1()
returns jsonb
language sql
set search_path = pg_catalog
as $function$
  select jsonb_build_object(
    'total_public_tables', count(*),
    'intentional_deny_all_clients', count(*) filter (where classification = 'INTENTIONAL_DENY_ALL_CLIENTS'),
    'policy_required', count(*) filter (where classification = 'POLICY_REQUIRED'),
    'policy_present', count(*) filter (where classification = 'POLICY_PRESENT'),
    'rls_disabled', count(*) filter (where classification = 'RLS_DISABLED')
  )
  from public.powerhouse_public_rls_policy_classification_v1;
$function$;

comment on function public.powerhouse_public_rls_policy_audit_v1() is
'Invoker-rights, fail-closed Powerhouse RLS policy-intent audit. A nonzero policy_required or rls_disabled count is a security obligation; this function never auto-creates policies.';

revoke all on function public.powerhouse_public_rls_policy_audit_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_public_rls_policy_audit_v1() to service_role;
