begin;
alter function public.bg_brein_regels_check(text,text,text) set search_path = public, pg_catalog;
alter function public.bg_actualiseer_connecties_via_lessen() set search_path = public, pg_catalog;
alter function public.powerhouse_execution_status(date) set search_path = public, pg_catalog;
alter function public.powerhouse_enforce_completion() set search_path = public, pg_catalog;
alter function public.powerhouse_daily_execution_guard(date) set search_path = public, pg_catalog;
alter function public.powerhouse_forecast_priority(uuid) set search_path = public, pg_catalog;
alter function public.powerhouse_recompute_first_mover_score(numeric,numeric,numeric,numeric,numeric,numeric,numeric,integer) set search_path = public, pg_catalog;
alter function public.powerhouse_forecast_brier(numeric,integer) set search_path = public, pg_catalog;
alter function public.powerhouse_sync_forecast_calibration_obligation() set search_path = public, pg_catalog;
alter function public.powerhouse_predictive_health(date) set search_path = public, pg_catalog;
alter function public.powerhouse_reconcile_social_delivery(date) set search_path = public, pg_catalog;
alter function public.content_publication_state_rank(text) set search_path = public, pg_catalog;
alter function public.normalize_content_operations_tenant() set search_path = public, pg_catalog;
alter function public.powerhouse_publication_proof_health(date) set search_path = public, pg_catalog;
alter function public.enforce_linkedin_personal_artifact_identity_gate_v3() set search_path = public, pg_catalog;
alter function public.enforce_linkedin_personal_obligation_identity_gate_v3() set search_path = public, pg_catalog;
insert into public.brain_failure_registry(fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,occurrence_count,version,first_seen_at,last_seen_at,evidence)
values('mutable-function-search-path-regression-v1','OBSERVED','Public-schema Powerhouse functions were created without an explicit search_path, so object resolution depended on the caller/session search_path. Supabase Security Advisor flagged 16 functions.','Pin each affected function search_path to the canonical public schema plus pg_catalog without changing function logic or privileges.','Every created or replaced public-schema function must declare a deterministic search_path in the same migration. Mutable search_path warnings are security regressions and must fail release review.','powerhouse-function-search-path-v1',1,1,now(),now(),jsonb_build_object('detected_on','2026-09-15','contract','powerhouse-function-search-path-v1','functions_hardened',16,'search_path','public, pg_catalog'))
on conflict (fingerprint) do update set root_cause=excluded.root_cause,proven_fix=excluded.proven_fix,prevention_rule=excluded.prevention_rule,regression_ref=excluded.regression_ref,occurrence_count=public.brain_failure_registry.occurrence_count + 1,last_seen_at=now(),evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;
commit;
