-- P0 #4198: count only actual recipient-directed DONE actions as outbound contact pressure.
-- Preserve the existing security_invoker view, its output columns, dependencies and all
-- linked CRM/sales actions. Do not create another scheduler, sender, table or view.
-- Root cause: 'research_enrichment' (channel 'internal') had executed_at, and was
-- previously miscounted as messages to people, inflating cooldown / follow-up.
CREATE OR REPLACE VIEW public.powerhouse_contact_pressure_v1
  WITH (security_invoker = true)
AS
WITH outbound AS (
         SELECT powerhouse_sales_actions.person_key,
            max(powerhouse_sales_actions.executed_at) AS last_outbound_at,
            count(*) FILTER (WHERE powerhouse_sales_actions.executed_at >= (now() - '7 days'::interval))::integer AS outbound_7d,
            count(*) FILTER (WHERE powerhouse_sales_actions.executed_at >= (now() - '30 days'::interval))::integer AS outbound_30d,
            count(*) FILTER (WHERE powerhouse_sales_actions.executed_at >= (now() - '90 days'::interval))::integer AS outbound_90d
           FROM powerhouse_sales_actions
          WHERE powerhouse_sales_actions.person_key IS NOT NULL AND powerhouse_sales_actions.executed_at IS NOT NULL
            AND powerhouse_sales_actions.status = 'done'
            AND lower(regexp_replace(powerhouse_sales_actions.channel, '[^a-zA-Z0-9]+', '_', 'g'))
              IN ('email', 'e_mail', 'linkedin_dm')
          GROUP BY powerhouse_sales_actions.person_key
        ), inbound AS (
         SELECT powerhouse_runtime_events.person_key,
            max(powerhouse_runtime_events.occurred_at) AS last_inbound_at,
            count(*) FILTER (WHERE powerhouse_runtime_events.occurred_at >= (now() - '30 days'::interval))::integer AS inbound_30d
           FROM powerhouse_runtime_events
          WHERE powerhouse_runtime_events.person_key IS NOT NULL AND (lower(powerhouse_runtime_events.event_type) = ANY (ARRAY['dm_inbound'::text, 'linkedin_post_replied'::text]))
          GROUP BY powerhouse_runtime_events.person_key
        ), noresp AS (
         SELECT powerhouse_sales_outcomes.person_key,
            count(*) FILTER (WHERE powerhouse_sales_outcomes.occurred_at >= (now() - '30 days'::interval) AND lower(powerhouse_sales_outcomes.outcome_type) = 'no_response'::text)::integer AS no_response_30d,
            count(*) FILTER (WHERE powerhouse_sales_outcomes.occurred_at >= (now() - '90 days'::interval) AND lower(powerhouse_sales_outcomes.outcome_type) = 'no_response'::text)::integer AS no_response_90d,
            max(powerhouse_sales_outcomes.occurred_at) FILTER (WHERE lower(powerhouse_sales_outcomes.outcome_type) = 'no_response'::text) AS last_no_response_at
           FROM powerhouse_sales_outcomes
          WHERE powerhouse_sales_outcomes.person_key IS NOT NULL
          GROUP BY powerhouse_sales_outcomes.person_key
        ), base AS (
         SELECT p.person_key,
            p.person_name,
            p.company_name,
            p.role,
            p.available_channels,
            p.relationship_warmth,
            p.decision_influence,
            COALESCE(o.outbound_7d, 0) AS outbound_7d,
            COALESCE(o.outbound_30d, 0) AS outbound_30d,
            COALESCE(o.outbound_90d, 0) AS outbound_90d,
            o.last_outbound_at,
            i.last_inbound_at,
            COALESCE(i.inbound_30d, 0) AS inbound_30d,
            COALESCE(n.no_response_30d, 0) AS no_response_30d,
            COALESCE(n.no_response_90d, 0) AS no_response_90d,
            n.last_no_response_at
           FROM powerhouse_person_intelligence_v1 p
             LEFT JOIN outbound o ON o.person_key = p.person_key
             LEFT JOIN inbound i ON i.person_key = p.person_key
             LEFT JOIN noresp n ON n.person_key = p.person_key
        ), scored AS (
         SELECT b.person_key,
            b.person_name,
            b.company_name,
            b.role,
            b.available_channels,
            b.relationship_warmth,
            b.decision_influence,
            b.outbound_7d,
            b.outbound_30d,
            b.outbound_90d,
            b.last_outbound_at,
            b.last_inbound_at,
            b.inbound_30d,
            b.no_response_30d,
            b.no_response_90d,
            b.last_no_response_at,
            LEAST(1::numeric, GREATEST(0::numeric, 0.14 * LEAST(4, b.outbound_7d)::numeric + 0.05 * LEAST(8, b.outbound_30d)::numeric + 0.22 * LEAST(3, b.no_response_30d)::numeric - 0.16 * LEAST(3, b.inbound_30d)::numeric)) AS pressure_score,
                CASE
                    WHEN b.no_response_30d >= 2 AND b.last_outbound_at IS NOT NULL THEN b.last_outbound_at + '14 days'::interval
                    WHEN b.outbound_7d >= 3 AND b.last_outbound_at IS NOT NULL THEN b.last_outbound_at + '7 days'::interval
                    WHEN b.outbound_7d >= 2 AND b.last_outbound_at IS NOT NULL THEN b.last_outbound_at + '3 days'::interval
                    ELSE NULL::timestamp with time zone
                END AS cooldown_until
           FROM base b
        )
 SELECT person_key,
    person_name,
    company_name,
    role,
    available_channels,
    relationship_warmth,
    decision_influence,
    outbound_7d,
    outbound_30d,
    outbound_90d,
    last_outbound_at,
    last_inbound_at,
    inbound_30d,
    no_response_30d,
    no_response_90d,
    last_no_response_at,
    pressure_score,
    cooldown_until,
        CASE
            WHEN cooldown_until > now() THEN 'cooldown'::text
            WHEN pressure_score >= 0.70 THEN 'high'::text
            WHEN pressure_score >= 0.35 THEN 'medium'::text
            ELSE 'low'::text
        END AS pressure_state,
    last_outbound_at IS NOT NULL AND (last_inbound_at IS NULL OR last_inbound_at < last_outbound_at) AS pending_response,
        CASE
            WHEN cooldown_until > now() THEN cooldown_until
            WHEN last_outbound_at IS NOT NULL AND (last_inbound_at IS NULL OR last_inbound_at < last_outbound_at) THEN last_outbound_at + '5 days'::interval
            ELSE NULL::timestamp with time zone
        END AS next_follow_up_at
   FROM scored s;
