-- P0 #4198: reduce repeated correlated scans in the canonical predictive-revenue scorer.
-- Non-destructive indexes only. Do not change commercial send policy, lead selection,
-- single scheduler, provider side effects, AI governance, or channel authority.
-- Existing scorer matches on company/topic, forecast scope/topic and observed outcomes.
SET LOCAL lock_timeout = '3s';
CREATE INDEX IF NOT EXISTS ph_predictive_signals_entity_lookup_p0
  ON public.powerhouse_predictive_signals (entity_key)
  WHERE entity_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ph_forecasts_active_scope_lookup_p0
  ON public.powerhouse_forecasts (scope_key)
  WHERE status IN ('active','claimed') AND scope_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ph_forecasts_active_topic_lookup_p0
  ON public.powerhouse_forecasts (topic_key)
  WHERE status IN ('active','claimed') AND topic_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ph_sales_outcomes_opportunity_lookup_p0
  ON public.powerhouse_sales_outcomes (opportunity_key)
  WHERE opportunity_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ph_sales_outcomes_content_lookup_p0
  ON public.powerhouse_sales_outcomes (content_key)
  WHERE content_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ph_sales_outcomes_campaign_lookup_p0
  ON public.powerhouse_sales_outcomes (campaign_key)
  WHERE campaign_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ph_sales_outcomes_topic_lookup_p0
  ON public.powerhouse_sales_outcomes (topic_key)
  WHERE topic_key IS NOT NULL;
ANALYZE public.powerhouse_predictive_signals;
ANALYZE public.powerhouse_forecasts;
ANALYZE public.powerhouse_sales_outcomes;
