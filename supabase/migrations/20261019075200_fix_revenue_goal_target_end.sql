-- Canonical €1m revenue goal: 1 September 2027 (not 29 September).
-- Preserve the original measurement start and all existing output column names.
CREATE OR REPLACE VIEW public.powerhouse_one_million_revenue_pace_v1 AS
WITH cfg AS (
 SELECT DATE '2026-09-29' AS target_start,
        DATE '2027-09-01' AS target_end,
        1000000::numeric AS target_eur
), actual AS (
 SELECT COALESCE(SUM(s.revenue_eur),0::numeric) AS realized_revenue_eur
 FROM public.powerhouse_sales_outcomes s CROSS JOIN cfg
 WHERE s.occurred_at >= cfg.target_start::timestamptz
   AND s.occurred_at < (cfg.target_end + 1)::timestamptz
), pace AS (
 SELECT cfg.*, actual.realized_revenue_eur,
        GREATEST(1, cfg.target_end - cfg.target_start)::numeric AS total_days,
        GREATEST(0, LEAST(cfg.target_end - cfg.target_start, CURRENT_DATE - cfg.target_start))::numeric AS elapsed_days,
        GREATEST(0, cfg.target_end - CURRENT_DATE)::numeric AS remaining_days
 FROM cfg CROSS JOIN actual
)
SELECT target_start, target_end, target_eur, realized_revenue_eur,
 round(target_eur / 12, 2) AS nominal_monthly_target_eur,
 round(target_eur / 52, 2) AS nominal_weekly_target_eur,
 round(target_eur / 260, 2) AS nominal_business_day_target_eur,
 round(target_eur * elapsed_days / total_days, 2) AS paced_target_eur,
 round(realized_revenue_eur - target_eur * elapsed_days / total_days, 2) AS pace_variance_eur,
 GREATEST(0::numeric, target_eur - realized_revenue_eur) AS remaining_revenue_eur,
 CASE WHEN remaining_days > 0 THEN round(GREATEST(0::numeric, target_eur - realized_revenue_eur) / remaining_days, 2)
 ELSE GREATEST(0::numeric, target_eur - realized_revenue_eur) END AS required_calendar_day_eur,
 CASE WHEN realized_revenue_eur >= target_eur THEN 'TARGET_REACHED'::text
 WHEN realized_revenue_eur >= target_eur * elapsed_days / total_days THEN 'ON_OR_AHEAD'::text
 ELSE 'BEHIND_PACE'::text END AS pace_status,
 now() AS measured_at
FROM pace;
-- Post-deploy acceptance: SELECT target_start,target_end,target_eur FROM public.powerhouse_one_million_revenue_pace_v1;
