-- CRO agents use one existing event authority; this read-only projection is not a new collector.
-- Site-only, consented, non-bot rows; raw events stay protected by existing RLS.
CREATE OR REPLACE VIEW public.bg_cro_behavior_daily_v1 WITH (security_invoker = true) AS
SELECT
  (coalesce(gebeurd_op,ontvangen_op) AT TIME ZONE 'UTC')::date AS day,
  pad,
  coalesce(apparaat,'onbekend') AS device,
  CASE WHEN gebeurtenis = 'pagina_verlaten'
    THEN coalesce(nullif(onderdeel,''),'sectie_onbekend')
    ELSE '_overige_events'
  END AS last_visible_section,
  count(*) FILTER (WHERE gebeurtenis = 'pagina')::bigint AS page_events,
  count(DISTINCT sessie) FILTER (WHERE gebeurtenis = 'pagina')::bigint AS tab_sessions,
  count(*) FILTER (WHERE gebeurtenis = 'scroll' AND diepte_pct = 25)::bigint AS scroll_reached_25,
  count(*) FILTER (WHERE gebeurtenis = 'scroll' AND diepte_pct = 50)::bigint AS scroll_reached_50,
  count(*) FILTER (WHERE gebeurtenis = 'scroll' AND diepte_pct = 75)::bigint AS scroll_reached_75,
  count(*) FILTER (WHERE gebeurtenis = 'scroll' AND diepte_pct = 100)::bigint AS scroll_reached_100,
  count(*) FILTER (WHERE gebeurtenis = 'pagina_verlaten')::bigint AS observed_exits,
  count(*) FILTER (WHERE gebeurtenis = 'pagina_verlaten' AND diepte_pct < 25)::bigint AS observed_exits_under_25,
  count(*) FILTER (WHERE gebeurtenis = 'formulier_start')::bigint AS form_starts,
  count(*) FILTER (WHERE gebeurtenis = 'formulier_fout')::bigint AS form_errors,
  count(*) FILTER (WHERE gebeurtenis = 'formulier_verlaten')::bigint AS form_abandons,
  count(*) FILTER (WHERE gebeurtenis = 'whatsapp_klik')::bigint AS whatsapp_clicks,
  count(*) FILTER (WHERE gebeurtenis = 'frustratie_klik')::bigint AS rapid_click_heuristics,
  count(*) FILTER (WHERE gebeurtenis = 'popup_getoond')::bigint AS popup_exposures,
  count(*) FILTER (WHERE gebeurtenis = 'experiment_blootstelling')::bigint AS experiment_exposures,
  max(ontvangen_op) AS last_observed_at
FROM public.bg_interacties
WHERE is_robot = false
  AND toestemming IS TRUE
  AND gebied = 'site'
  AND ontvangen_op >= now() - interval '35 days'
GROUP BY 1,2,3,4;

REVOKE ALL ON public.bg_cro_behavior_daily_v1 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.bg_cro_behavior_daily_v1 TO service_role;

COMMENT ON VIEW public.bg_cro_behavior_daily_v1 IS
  'Consented non-bot site behavior aggregate, intended only for existing Powerhouse read-model; pagehide exits are incomplete observations, not true exit totals.';
