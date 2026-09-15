begin;

-- Internal operational views must not run with owner privileges through the Data API.
-- Force invoker semantics and remove browser/API read access; service_role remains canonical runtime.
do $$
declare
  v text;
begin
  foreach v in array array[
    'bg_connectie_activiteit',
    'bg_connecties_stand',
    'bg_connectiescore',
    'bg_machine_status',
    'bg_paginarendement',
    'bg_post_prestatie',
    'bg_trechter_dag',
    'bg_vandaag',
    'bg_verkeer_verdacht',
    'content_operations_cockpit',
    'powerhouse_first_mover_queue'
  ] loop
    if to_regclass('public.' || v) is null then
      raise exception 'required internal view public.% does not exist', v;
    end if;
    execute format('alter view public.%I set (security_invoker = true)', v);
    execute format('revoke all on table public.%I from anon, authenticated', v);
    execute format('grant select on table public.%I to service_role', v);
  end loop;
end $$;

-- Internal SECURITY DEFINER functions must not be callable through public RPC.
revoke execute on function public.bg_connecties_dagselectie(integer) from public, anon, authenticated;
revoke execute on function public.bg_content_lessen() from public, anon, authenticated;
revoke execute on function public.bg_uitkomst_vastleggen(text,text,numeric,text,text,text,jsonb,text,text) from public, anon, authenticated;
revoke execute on function public.powerhouse_fill_action_identity() from public, anon, authenticated;
revoke execute on function public.sync_social_post_content_chain() from public, anon, authenticated;

grant execute on function public.bg_connecties_dagselectie(integer) to service_role;
grant execute on function public.bg_content_lessen() to service_role;
grant execute on function public.bg_uitkomst_vastleggen(text,text,numeric,text,text,text,jsonb,text,text) to service_role;
grant execute on function public.powerhouse_fill_action_identity() to service_role;
grant execute on function public.sync_social_post_content_chain() to service_role;

-- bg_klik_vastleggen(text,text) remains intentionally public because /g/... public links use it
-- for click attribution. Its destination is allow-listed to bedrijfsgeheugen.nl and this exception
-- must remain explicit and reviewed rather than accidentally inherited.

insert into public.brain_failure_registry(
  fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,
  occurrence_count,version,first_seen_at,last_seen_at,evidence
)
values(
  'public-security-definer-surface-regression-v1',
  'OBSERVED',
  'Internal operational views inherited owner-privilege semantics and broad anon/authenticated SELECT, while internal SECURITY DEFINER functions inherited public EXECUTE. This exposed internal commercial and control-plane surfaces through the Data API/RPC layer.',
  'Set internal views to security_invoker, revoke anon/authenticated access, preserve service_role SELECT, and revoke public execution from internal SECURITY DEFINER RPCs. Keep only explicitly reviewed public exceptions.',
  'Every public-schema view or SECURITY DEFINER function must be classified at creation as PUBLIC_INTENTIONAL or INTERNAL_SERVER_ONLY. INTERNAL_SERVER_ONLY gets invoker/revoked browser access in the same migration. PUBLIC_INTENTIONAL requires an explicit reason, constrained inputs, and security-advisor exception evidence.',
  'powerhouse-security-definer-surface-v1',
  1,
  1,
  now(),
  now(),
  jsonb_build_object(
    'detected_on','2026-09-15',
    'contract','powerhouse-security-definer-surface-v1',
    'views_hardened',11,
    'internal_rpcs_hardened',5,
    'intentional_public_exception','bg_klik_vastleggen(text,text)',
    'exception_reason','public /g/... click attribution; destination allow-listed to bedrijfsgeheugen.nl'
  )
)
on conflict (fingerprint) do update
set root_cause=excluded.root_cause,
    proven_fix=excluded.proven_fix,
    prevention_rule=excluded.prevention_rule,
    regression_ref=excluded.regression_ref,
    occurrence_count=public.brain_failure_registry.occurrence_count + 1,
    last_seen_at=now(),
    evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;

commit;
