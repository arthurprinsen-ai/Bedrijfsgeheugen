-- Applied to Supabase as migration 20261014195237.
-- Approval still requires real identity and source verification outside SQL.
alter table public.portal_financial_forecasts_v1
  add column if not exists independent_review jsonb not null default '{}'::jsonb;

alter table public.portal_financial_forecasts_v1
  add constraint portal_financial_forecast_independent_review_v3 check (
    verification_status <> 'passed'
    or (
      jsonb_typeof(independent_review)='object'
      and length(btrim(coalesce(independent_review->>'prepared_by',''))) > 0
      and length(btrim(coalesce(independent_review->>'approved_by',''))) > 0
      and independent_review->>'prepared_by' <> independent_review->>'approved_by'
      and independent_review->>'approved_by' = verified_by
      and length(btrim(coalesce(independent_review->>'approval_evidence_ref',''))) > 0
      and length(btrim(coalesce(independent_review->>'backtest_evidence_ref',''))) > 0
      and length(btrim(coalesce(independent_review->>'financial_source_evidence_ref',''))) > 0
      and independent_review->>'financial_source_evidence_ref'=source_evidence_ref
      and jsonb_array_length(historical_points) >= 6
      and (backtest->>'holdout_count')::numeric <= jsonb_array_length(historical_points)-3
    )
  );

comment on column public.portal_financial_forecasts_v1.independent_review is
'Restricted evidence handles and separate preparer/reviewer IDs, service-role only. These structure checks do not authenticate a reviewer; genuine independent sign-off still requires an authorized workflow.';
