-- Strengthen accepted financial forecasts without weakening tenant or release controls.
-- The existing financial forecast source was empty when this migration was applied.
alter table public.portal_financial_forecasts_v1
  add constraint portal_financial_forecast_backtest_metrics_v2 check (
    verification_status <> 'passed' or (
      coalesce(backtest->>'status' = 'passed', false)
      and length(btrim(coalesce(backtest->>'method',''))) > 0
      and coalesce(jsonb_typeof(backtest->'holdout_count') = 'number', false)
      and coalesce((backtest->>'holdout_count')::numeric between 3 and 120, false)
      and coalesce(jsonb_typeof(backtest->'mae') = 'number', false)
      and coalesce((backtest->>'mae')::numeric >= 0, false)
      and coalesce(jsonb_typeof(backtest->'baseline_mae') = 'number', false)
      and coalesce((backtest->>'baseline_mae')::numeric >= 0, false)
    )
  );
alter table public.portal_financial_forecasts_v1
  add constraint portal_financial_forecast_band_lengths_v2 check (
    (lower_points is null and upper_points is null)
    or (lower_points is not null and upper_points is not null
      and jsonb_array_length(lower_points) = jsonb_array_length(forecast_points)
      and jsonb_array_length(upper_points) = jsonb_array_length(forecast_points))
  );
comment on constraint portal_financial_forecast_backtest_metrics_v2 on public.portal_financial_forecasts_v1 is 'Independently reviewed forecasts require at least 3 holdout observations, non-negative MAE and naive-baseline MAE, plus explicit review and source evidence. Numeric metrics do not alone prove independent review.';
