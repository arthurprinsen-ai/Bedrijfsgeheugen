-- Additive service-role CRO diagnostics over existing canonical writers, no new scheduler.
CREATE OR REPLACE VIEW public.powerhouse_cro_site_signal_v1 WITH (security_invoker=true) AS
WITH raw AS (
 SELECT pad,
 count(*) AS total_events_7d,
 count(*) FILTER (WHERE is_robot IS TRUE) AS robot_events_7d,
 count(*) FILTER (WHERE is_robot IS FALSE AND gebeurtenis='pagina') AS nonrobot_page_events_7d,
 count(*) FILTER (WHERE is_robot IS FALSE AND toestemming IS TRUE AND gebeurtenis='pagina') AS consented_page_events_7d,
 count(*) FILTER (WHERE is_robot IS FALSE AND gebeurtenis='klik') AS nonrobot_click_events_7d,
 count(*) FILTER (WHERE is_robot IS FALSE AND toestemming IS TRUE AND gebeurtenis='klik') AS consented_click_events_7d,
 count(*) FILTER (WHERE is_robot IS FALSE AND event_uid IS NOT NULL) AS persisted_receipts_7d,
 max(ontvangen_op) AS last_event_at
 FROM public.bg_interacties
 WHERE gebied='site' AND ontvangen_op>=now()-interval '7 days'
 AND pad LIKE '/%' AND length(pad)<=180
 GROUP BY pad
), growth AS (
 SELECT substring(canonical FROM length('https://www.bedrijfsgeheugen.nl')+1) AS pad,
 count(*) FILTER (WHERE is_robot IS FALSE AND event_type IN
 ('primary_cta_click','secondary_cta_click','money_link_click','cta_click')) AS cta_events_7d
 FROM public.growth_events
 WHERE occurred_at>=now()-interval '7 days'
 AND canonical LIKE 'https://www.bedrijfsgeheugen.nl/%'
 GROUP BY 1
)
SELECT
 'website'::text AS source_channel,r.pad AS content_key,
 r.total_events_7d,r.robot_events_7d,r.nonrobot_page_events_7d,
 r.consented_page_events_7d,r.nonrobot_click_events_7d,
 r.consented_click_events_7d,r.persisted_receipts_7d,
 coalesce(g.cta_events_7d,0::bigint) AS observed_cta_events_7d,
 round(100.0*r.robot_events_7d/nullif(r.total_events_7d,0),1) AS flagged_robot_event_pct_7d,
 (r.nonrobot_click_events_7d>0 AND coalesce(g.cta_events_7d,0)=0) AS cta_mapping_gap_signal,
 CASE
 WHEN r.consented_page_events_7d<30 THEN 'LOW_CONSENTED_SAMPLE'
 WHEN r.nonrobot_click_events_7d>0 AND coalesce(g.cta_events_7d,0)=0
 THEN 'CTA_MAPPING_GAP_REQUIRES_VERIFICATION'
 ELSE 'OBSERVATIONAL_ONLY_EXPERIMENT_REQUIRED'
 END AS evidence_status,
 CASE
 WHEN r.nonrobot_click_events_7d>0 AND coalesce(g.cta_events_7d,0)=0
 THEN 'AUDIT_ORIGINAL_CONSENTED_CTA_BRIDGE'
 WHEN r.consented_page_events_7d<30
 THEN 'IMPROVE_MEASUREMENT_COVERAGE_WITHOUT_BYPASSING_CONSENT'
 ELSE 'PROPOSE_SINGLE_VARIABLE_CONTROLLED_CRO_EXPERIMENT'
 END AS suggested_action,
 r.last_event_at
FROM raw r LEFT JOIN growth g ON g.pad=r.pad;
REVOKE ALL ON public.powerhouse_cro_site_signal_v1 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.powerhouse_cro_site_signal_v1 TO service_role;
COMMENT ON VIEW public.powerhouse_cro_site_signal_v1 IS
 'Consent- and bot-aware page diagnostic; flagged nonrobot events do not prove unique humans or conversion. Server only.';

CREATE OR REPLACE VIEW public.powerhouse_cro_post_signal_v1 WITH (security_invoker=true) AS
WITH latest AS (
 SELECT DISTINCT ON (tenant_id,post_id) tenant_id,post_id,observed_at,source,data_quality,metrics
 FROM public.social_metric_snapshots
 WHERE observed_at>=now()-interval '7 days'
 ORDER BY tenant_id,post_id,observed_at DESC
), measures AS (
 SELECT p.tenant_id,p.post_id,p.platform,p.channel_kind,p.published_at,
 p.topic,p.format,p.hook_type,p.cta_type,
 s.observed_at AS provider_observed_at,s.source AS provider_source,s.data_quality,
 CASE WHEN jsonb_typeof(s.metrics->'reach')='number' THEN (s.metrics->>'reach')::numeric END AS reach,
 CASE WHEN jsonb_typeof(s.metrics->'impressions')='number' THEN (s.metrics->>'impressions')::numeric END AS impressions,
 CASE WHEN jsonb_typeof(s.metrics->'views')='number' THEN (s.metrics->>'views')::numeric END AS views,
 CASE WHEN jsonb_typeof(s.metrics->'likes')='number' THEN (s.metrics->>'likes')::numeric END AS likes,
 CASE WHEN jsonb_typeof(s.metrics->'comments')='number' THEN (s.metrics->>'comments')::numeric END AS comments,
 CASE WHEN jsonb_typeof(s.metrics->'clicks')='number' THEN (s.metrics->>'clicks')::numeric END AS clicks,
 CASE WHEN jsonb_typeof(s.metrics->'reactions')='number' THEN (s.metrics->>'reactions')::numeric END AS reactions
 FROM latest s JOIN public.social_posts p ON p.tenant_id=s.tenant_id AND p.post_id=s.post_id
 WHERE p.tenant_id IN ('canonical','bedrijfsgeheugen')
 AND p.published_at IS NOT NULL AND nullif(p.external_post_id,'') IS NOT NULL
)
SELECT tenant_id,post_id,platform,channel_kind,published_at,topic,format,hook_type,cta_type,
 provider_observed_at,provider_source,data_quality,reach,impressions,views,likes,comments,clicks,reactions,
 CASE WHEN platform='instagram' THEN reach
 WHEN platform='linkedin' AND channel_kind='linkedin_company' THEN impressions
 END AS distribution_denominator,
 CASE WHEN platform='instagram' THEN 'reach'
 WHEN platform='linkedin' AND channel_kind='linkedin_company' THEN 'impressions'
 ELSE 'unavailable' END AS denominator_kind,
 CASE WHEN platform='linkedin' AND channel_kind='linkedin_personal'
 THEN 'PARTIAL_SCOPE_NO_COMPARABLE_IMPRESSIONS'
 WHEN (CASE WHEN platform='instagram' THEN reach ELSE impressions END) IS NULL
 THEN 'DISTRIBUTION_METRIC_UNAVAILABLE'
 WHEN (CASE WHEN platform='instagram' THEN reach ELSE impressions END)<50
 THEN 'LOW_DISTRIBUTION_SAMPLE'
 ELSE 'OBSERVATIONAL_ONLY_NO_CAUSAL_CLAIM'
 END AS evidence_status,
 CASE WHEN platform='linkedin' AND channel_kind='linkedin_personal'
 THEN 'COMPARE_REACTIONS_ONLY_WITH_SAME_SCOPE_AND_AGE'
 WHEN (CASE WHEN platform='instagram' THEN reach ELSE impressions END) IS NULL
 THEN 'REPAIR_ORIGINAL_PROVIDER_METRIC_SCOPE'
 WHEN (CASE WHEN platform='instagram' THEN reach ELSE impressions END)<50
 THEN 'TEST_HOOK_AND_FORMAT_WITH_CONTROL'
 ELSE 'DESIGN_SINGLE_VARIABLE_POST_EXPERIMENT'
 END AS suggested_action,
 CASE WHEN likes IS NOT NULL AND comments IS NOT NULL
 AND (CASE WHEN platform='instagram' THEN reach ELSE impressions END)>=50
 THEN round(100.0*(likes+comments)/nullif((CASE WHEN platform='instagram' THEN reach ELSE impressions END),0),2)
 END AS observed_like_comment_pct
FROM measures;
REVOKE ALL ON public.powerhouse_cro_post_signal_v1 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.powerhouse_cro_post_signal_v1 TO service_role;
COMMENT ON VIEW public.powerhouse_cro_post_signal_v1 IS
 'Provider observed post diagnostics, no synthetic impressions, causal lift, paid orders or exact-age claim. Server only.';

-- Email CRO remains inside the original Powerhouse sales/reply/learning lineage.
-- Historical aggregate counts are not conflated with independent provider proof.
CREATE OR REPLACE VIEW public.powerhouse_cro_email_signal_v1 WITH (security_invoker=true) AS
WITH historical AS (
 SELECT coalesce(nullif(persuasion_strategy,''),'unknown') AS persuasion_strategy,
 count(*) AS cohort_rows,
 coalesce(sum(greatest(coalesce(sent_count,0),0)),0)::bigint AS reported_sends,
 coalesce(sum(greatest(coalesce(reply_count,0),0)),0)::bigint AS reported_replies,
 coalesce(sum(greatest(coalesce(positive_reply_count,0),0)),0)::bigint AS reported_positive_replies,
 coalesce(sum(greatest(coalesce(unsubscribe_count,0),0)),0)::bigint AS reported_unsubscribes,
 coalesce(sum(greatest(coalesce(order_count,0),0)),0)::bigint AS reported_orders,
 max(last_recomputed_at) AS stats_updated_at
 FROM public.powerhouse_email_learning_stats GROUP BY 1
), provider AS (
 SELECT count(*) FILTER (WHERE executed_at>=now()-interval '7 days') AS recorded_executions_7d,
 count(*) FILTER (WHERE executed_at>=now()-interval '7 days'
   AND evidence->>'provider_send_ack_verified'='true'
   AND evidence->>'provider_readback_verified'='true') AS verified_send_readbacks_7d,
 max(executed_at) FILTER (
   WHERE evidence->>'provider_send_ack_verified'='true'
   AND evidence->>'provider_readback_verified'='true') AS latest_verified_send_readback_at
 FROM public.powerhouse_sales_actions
 WHERE channel='email' AND action_type IN ('autonomous_email','reply_followup','email_followup')
), replies AS (
 SELECT max(occurred_at) AS last_reply_event_at FROM public.powerhouse_email_reply_events
), suppressions AS (
 SELECT count(*) AS active_suppressions
 FROM public.powerhouse_email_contact_suppressions WHERE active IS TRUE
)
SELECT 'email'::text AS source_channel,h.persuasion_strategy AS content_key,
 h.cohort_rows,h.reported_sends,h.reported_replies,h.reported_positive_replies,
 h.reported_unsubscribes,h.reported_orders,h.stats_updated_at,
 p.recorded_executions_7d,p.verified_send_readbacks_7d,p.latest_verified_send_readback_at,
 r.last_reply_event_at,s.active_suppressions,
 CASE
 WHEN p.verified_send_readbacks_7d=0 THEN 'NO_RECENT_VERIFIED_EMAIL_SEND'
 WHEN h.stats_updated_at IS NULL OR h.stats_updated_at<now()-interval '48 hours' THEN 'EMAIL_LEARNING_STALE'
 WHEN h.reported_sends<30 THEN 'LOW_REPORTED_SAMPLE'
 ELSE 'OBSERVATIONAL_ONLY_CONTROLLED_EXPERIMENT_REQUIRED'
 END AS evidence_status,
 CASE
 WHEN p.verified_send_readbacks_7d=0 THEN 'REPAIR_ORIGINAL_AUTHORIZED_SEND_AND_PROVIDER_READBACK'
 WHEN h.stats_updated_at IS NULL OR h.stats_updated_at<now()-interval '48 hours' THEN 'RECOMPUTE_ORIGINAL_LEARNING_FROM_PROVIDER_EVIDENCE'
 WHEN h.reported_sends<30 THEN 'HOLD_PROMOTION_UNTIL_COMPARABLE_SAMPLE_AND_SUPPRESSION_CHECK'
 ELSE 'DESIGN_CONSENT_AWARE_EMAIL_CONTROLLED_TEST'
 END AS suggested_action,
 CASE WHEN h.stats_updated_at>=now()-interval '48 hours' AND h.reported_sends>=30
 THEN round(100.0*h.reported_replies/nullif(h.reported_sends,0),2) END AS eligible_observed_reply_pct
FROM historical h CROSS JOIN provider p CROSS JOIN replies r CROSS JOIN suppressions s;
REVOKE ALL ON public.powerhouse_cro_email_signal_v1 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.powerhouse_cro_email_signal_v1 TO service_role;
COMMENT ON VIEW public.powerhouse_cro_email_signal_v1 IS
 'Server-only privacy-minimal email diagnostic: recorded execution and explicit send+readback proof separate from historical reported learning; no person/address/body, no causal or paid outcome claim.';
