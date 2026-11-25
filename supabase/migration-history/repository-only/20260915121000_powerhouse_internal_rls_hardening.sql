-- Harden internal Powerhouse control-plane tables that are server-only.
-- Canonical pattern: deny browser/Data API access; preserve service_role runtime.
-- This extends 20260911213000_dichte_tabellen_zonder_rls.sql to newer tables.

begin;

do $$
declare
  t text;
begin
  foreach t in array array[
    'instagram_growth_research_sources',
    'powerhouse_channel_decisions',
    'powerhouse_content_artifacts',
    'powerhouse_predictive_signals',
    'powerhouse_forecasts',
    'powerhouse_first_mover_claims',
    'powerhouse_forecast_calibration',
    'content_publication_obligations'
  ] loop
    if to_regclass('public.' || t) is null then
      raise exception 'required internal table public.% does not exist', t;
    end if;

    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;

-- SECURITY DEFINER publication-control RPCs would otherwise remain an RLS bypass.
-- They are internal Powerhouse operations and must only be callable by service_role.
revoke execute on function public.assert_content_publication_daily_invariant(date)
  from public, anon, authenticated;
revoke execute on function public.enforce_content_publication_daily_invariant(date, time without time zone, timestamp with time zone)
  from public, anon, authenticated;
revoke execute on function public.reconcile_social_post_publication_obligation()
  from public, anon, authenticated;
revoke execute on function public.record_content_publication_skip(text,date,text,text,jsonb)
  from public, anon, authenticated;
revoke execute on function public.record_content_publication_state(text,date,text,text,text,text,text,text,jsonb,jsonb,text,text)
  from public, anon, authenticated;
revoke execute on function public.sync_content_publication_obligations(date,date)
  from public, anon, authenticated;

grant execute on function public.assert_content_publication_daily_invariant(date) to service_role;
grant execute on function public.enforce_content_publication_daily_invariant(date, time without time zone, timestamp with time zone) to service_role;
grant execute on function public.reconcile_social_post_publication_obligation() to service_role;
grant execute on function public.record_content_publication_skip(text,date,text,text,jsonb) to service_role;
grant execute on function public.record_content_publication_state(text,date,text,text,text,text,text,text,jsonb,jsonb,text,text) to service_role;
grant execute on function public.sync_content_publication_obligations(date,date) to service_role;

-- Persist the failure mode and prevention rule in the existing Powerhouse learning registry.
insert into public.brain_failure_registry(
  fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,
  occurrence_count,version,first_seen_at,last_seen_at,evidence
)
values(
  'rls-disabled-internal-control-plane-regression-v1',
  'OBSERVED',
  'New internal Powerhouse tables were added to the exposed public schema with RLS disabled and inherited broad anon/authenticated table grants. Several SECURITY DEFINER publication RPCs also retained public EXECUTE, leaving an RLS-bypass path.',
  'Enable RLS with no browser policies on server-only tables, revoke anon/authenticated table privileges, retain service_role privileges, and revoke public execution of SECURITY DEFINER publication-control RPCs.',
  'Every new server-only public-schema table must ship in the same migration with RLS enabled, anon/authenticated privileges revoked, service_role explicitly preserved, and any SECURITY DEFINER RPC reviewed for public EXECUTE. Security-advisor regressions are fail-closed release blockers.',
  'powerhouse-internal-rls-hardening-v1',
  1,
  1,
  now(),
  now(),
  jsonb_build_object(
    'detected_on','2026-09-15',
    'contract','powerhouse-internal-rls-hardening-v1',
    'table_count',8,
    'tables',jsonb_build_array(
      'instagram_growth_research_sources','powerhouse_channel_decisions',
      'powerhouse_content_artifacts','powerhouse_predictive_signals','powerhouse_forecasts',
      'powerhouse_first_mover_claims','powerhouse_forecast_calibration','content_publication_obligations'
    ),
    'policy','server-only deny-by-default; service_role preserved'
  )
)
on conflict (fingerprint) do update
set maturity=excluded.maturity,
    root_cause=excluded.root_cause,
    proven_fix=excluded.proven_fix,
    prevention_rule=excluded.prevention_rule,
    regression_ref=excluded.regression_ref,
    occurrence_count=public.brain_failure_registry.occurrence_count + 1,
    version=greatest(public.brain_failure_registry.version, excluded.version),
    last_seen_at=now(),
    evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;

commit;
