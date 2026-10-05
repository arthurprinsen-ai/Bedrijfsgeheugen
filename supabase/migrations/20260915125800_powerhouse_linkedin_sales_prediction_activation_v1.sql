-- Production readback showed the safe next-best-action set had buying-window scores 0.30-0.33,
-- while the commercial forecast materializer started at 0.35. That produced actions without
-- pre-action commercial predictions. Lower only the forecast threshold to the already-gated
-- action eligibility boundary; direct outreach rules remain unchanged.

do $$
declare
  v_before text;
  v_after text;
begin
  select pg_get_functiondef('public.powerhouse_refresh_linkedin_sales_intelligence_v1(date)'::regprocedure) into v_before;
  v_after:=replace(v_before,
    'where n.buying_window_confidence>=0.35 and n.buying_window_score>=0.35',
    'where n.buying_window_confidence>=0.25 and n.buying_window_score>=0.30');
  if v_after=v_before then
    raise exception 'commercial forecast activation patch did not match current function';
  end if;
  if position('where n.buying_window_confidence>=0.25 and n.buying_window_score>=0.30' in v_after)=0 then
    raise exception 'commercial forecast activation threshold missing after patch';
  end if;
  execute v_after;
end
$$;

insert into public.brain_failure_registry(
  fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,occurrence_count,version,first_seen_at,last_seen_at,evidence)
values(
  'linkedin-sales-actions-without-preaction-forecast-v1','OBSERVED',
  'The first live intelligence refresh materialized twenty safe next-best-actions but zero commercial forecasts because the forecast threshold was stricter than the action threshold.',
  'Align commercial forecast eligibility with the already-gated safe action set (confidence >= 0.25, buying window >= 0.30) while preserving direct-outreach positive-value gates.',
  'Every materialized commercial next-best-action must have a pre-action forecast when evidence confidence meets the action gate; predictions must exist before outcomes so Brier calibration remains valid.',
  'tests/supabase-powerhouse-linkedin-sales-prediction-activation.test.mjs|powerhouse-linkedin-sales-intelligence-v1',
  1,1,now(),now(),jsonb_build_object('live_readback_actions',20,'live_readback_forecasts',0,'direct_outreach_gate_changed',false)
)
on conflict(fingerprint) do update set root_cause=excluded.root_cause,proven_fix=excluded.proven_fix,prevention_rule=excluded.prevention_rule,
  regression_ref=excluded.regression_ref,occurrence_count=public.brain_failure_registry.occurrence_count+1,
  version=greatest(public.brain_failure_registry.version,excluded.version),last_seen_at=now(),evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;
