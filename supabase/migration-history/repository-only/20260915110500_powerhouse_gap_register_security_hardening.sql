-- Harden the later-created autonomous gap register after production advisor readback.
-- This internal control-plane view must be security-invoker and service-role only.

do $$
begin
  if to_regclass('public.powerhouse_gap_register_v1') is not null then
    execute 'alter view public.powerhouse_gap_register_v1 set (security_invoker = true)';
    execute 'revoke all on table public.powerhouse_gap_register_v1 from public, anon, authenticated';
    execute 'grant select on table public.powerhouse_gap_register_v1 to service_role';
  end if;
end
$$;

do $$
begin
  if to_regclass('public.powerhouse_gap_register_v1') is not null then
    if has_table_privilege('anon','public.powerhouse_gap_register_v1','SELECT') then
      raise exception 'anon still has SELECT on powerhouse_gap_register_v1';
    end if;
    if has_table_privilege('authenticated','public.powerhouse_gap_register_v1','SELECT') then
      raise exception 'authenticated still has SELECT on powerhouse_gap_register_v1';
    end if;
    if not has_table_privilege('service_role','public.powerhouse_gap_register_v1','SELECT') then
      raise exception 'service_role lost SELECT on powerhouse_gap_register_v1';
    end if;
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname='powerhouse_gap_register_v1'
        and coalesce(c.reloptions,'{}'::text[]) @> array['security_invoker=true']
    ) then
      raise exception 'security_invoker not enabled on powerhouse_gap_register_v1';
    end if;
  end if;
end
$$;

insert into public.brain_failure_registry(
  fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,
  occurrence_count,version,first_seen_at,last_seen_at,evidence
)
values(
  'powerhouse-gap-register-browser-exposure-v1','OBSERVED',
  'A later autonomous gap-closer migration created powerhouse_gap_register_v1 with owner-security view semantics and browser-role SELECT, reintroducing the already-known internal-view exposure pattern.',
  'Set powerhouse_gap_register_v1 to security_invoker and revoke PUBLIC/anon/authenticated while retaining service_role SELECT.',
  'Every newly created internal Powerhouse view must be security_invoker and browser-role revoked in the same migration; security-advisor readback must remain a release gate.',
  'tests/supabase-powerhouse-gap-register-security.test.mjs|powerhouse-gap-register-browser-exposure-v1',
  1,1,now(),now(),
  jsonb_build_object('observed_on','2026-09-15','advisor_lint','security_definer_view','view','powerhouse_gap_register_v1','reintroduced_pattern',true,'fail_closed',true)
)
on conflict (fingerprint) do update set
  root_cause=excluded.root_cause,
  proven_fix=excluded.proven_fix,
  prevention_rule=excluded.prevention_rule,
  regression_ref=excluded.regression_ref,
  occurrence_count=public.brain_failure_registry.occurrence_count+1,
  version=greatest(public.brain_failure_registry.version,excluded.version),
  last_seen_at=now(),
  evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;
