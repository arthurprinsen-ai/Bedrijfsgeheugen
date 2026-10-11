-- POWERHOUSE / ONE BRAIN: bounded daily review of every existing connection.
-- Reuses the canonical enrichment state, sources, commercial decision engine,
-- and the existing identity-graph scheduler (job 138). Never sends messages.
-- Each reviewed connection receives a transparent daily recommendation.
CREATE OR REPLACE FUNCTION public.powerhouse_connection_daily_pulse_v1(
  p_run_date date DEFAULT (now() AT TIME ZONE 'Europe/Amsterdam')::date,
  p_batch_size integer DEFAULT 500
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $pulse$
DECLARE
  v_started timestamptz := clock_timestamp();
  v_batch jsonb;
  v_reviewed integer := 0;
  v_identity jsonb;
  v_graph_status text := 'not_due';
  v_complete boolean := false;
BEGIN
  -- A single transaction-level claim; no parallel executors or duplicate reviews.
  IF NOT pg_try_advisory_xact_lock(741001, 20261011) THEN
    RETURN jsonb_build_object('contract','powerhouse-connection-daily-pulse-v1',
                              'state','already_running','run_date',p_run_date);
  END IF;

  -- Existing bounded, source-backed projection. No mass external provider calls.
  v_batch := public.powerhouse_refresh_connection_enrichment_batch_v1(
    p_run_date, greatest(1, least(coalesce(p_batch_size,500),500))
  );

  -- Per-person intelligence: review each refreshed contact, preserve source
  -- provenance, and distinguish a business decision from an actual send.
  UPDATE public.powerhouse_connection_enrichment_state_v1 AS s
     SET source_snapshot = jsonb_set(
          coalesce(s.source_snapshot,'{}'::jsonb),
          '{daily_decision}',
          jsonb_build_object(
            'contract','powerhouse-contact-decision-v1',
            'reviewed_date',p_run_date,
            'reviewed_at',v_started,
            'decision', CASE
              WHEN c.status IN ('rust','afgewezen','niet_interessant','unsubscribe')
                THEN 'NO_ACTION_SUPPRESSED'
              WHEN s.latest_external_at >= v_started - interval '7 days'
                   AND (coalesce(s.linkedin_events_30d,0)>0
                     OR coalesce(s.external_signals_90d,0)>0
                     OR coalesce(s.company_news_120d,0)>0
                     OR coalesce(s.runtime_evidence_90d,0)>0)
                THEN 'CONTEXT_REVIEW_FOR_EXISTING_BRAIN'
              WHEN c.status='in_gesprek'
                THEN 'REVIEW_EXISTING_CONVERSATION'
              WHEN coalesce(s.data_completeness,0)<0.6
                THEN 'CANDIDATE_FOR_BOUNDED_RESEARCH'
              ELSE 'NO_NEW_ACTION'
            END,
            'linkedin_activity_30d',coalesce(s.linkedin_events_30d,0),
            'external_signals_90d',coalesce(s.external_signals_90d,0),
            'company_news_120d',coalesce(s.company_news_120d,0),
            'runtime_evidence_90d',coalesce(s.runtime_evidence_90d,0),
            'latest_external_at',s.latest_external_at,
            'fresh_external_fetch_performed',false,
            'source_basis','canonical existing ingested sources',
            'automatic_provider_send',false,
            'provider_delivery_proven',false,
            'further_action_requires_canonical_policy_and_source_evidence',true
          ),
          true
        ),
        updated_at = v_started
    FROM public.bg_connecties AS c
   WHERE s.person_key = coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))
     AND s.enrichment_date = p_run_date
     AND s.enriched_at >= v_started - interval '1 second';
  GET DIAGNOSTICS v_reviewed = ROW_COUNT;

  v_complete := coalesce((v_batch->>'full_graph_daily_refresh')::boolean,false);

  -- Preserve prior identity-graph cadence while using its existing job for
  -- short enrichment slices at 02/12/22/32/42/52 UTC each hour.
  IF extract(minute FROM (clock_timestamp() AT TIME ZONE 'UTC'))::integer = 32 THEN
    BEGIN
      v_identity := public.powerhouse_sync_identity_graph_batch_v1(100);
      v_graph_status := 'executed';
    EXCEPTION WHEN OTHERS THEN
      v_graph_status := 'retry_next_hour';
      RAISE WARNING 'IDENTITY_GRAPH_ISOLATED: %', SQLERRM;
    END;
  END IF;

  INSERT INTO public.powerhouse_runtime_events
    (dedupe_key,event_type,source,subject_key,occurred_at,evidence,
     context,state,data_quality,confidence)
  VALUES
    ('connection-daily-pulse:'||p_run_date::text,
     'connection_daily_intelligence_review',
     'powerhouse-connection-daily-pulse-v1','connection-universe',
     v_started,
     jsonb_build_object('batch',v_batch,'decisions_reviewed_in_batch',v_reviewed,
       'identity_graph',v_graph_status,'complete',v_complete),
     jsonb_build_object('existing_scheduler_job',138,'no_provider_send',true,
       'decision_is_not_delivery',true,'no_parallel_executor',true),
     CASE WHEN v_complete THEN 'actioned' ELSE 'observed' END,
     CASE WHEN v_complete THEN 'VERIFIED' ELSE 'PARTIAL' END,
     CASE WHEN v_complete THEN 1 ELSE 0.7 END)
  ON CONFLICT (dedupe_key) DO UPDATE SET
    occurred_at=EXCLUDED.occurred_at,
    evidence=EXCLUDED.evidence,
    context=EXCLUDED.context,
    state=EXCLUDED.state,
    data_quality=EXCLUDED.data_quality,
    confidence=EXCLUDED.confidence,
    updated_at=clock_timestamp();

  RETURN jsonb_build_object('contract','powerhouse-connection-daily-pulse-v1',
    'run_date',p_run_date,'reviewed_in_batch',v_reviewed,
    'connections_enriched_today',v_batch->'connections_enriched_today',
    'connections_remaining_today',v_batch->'connections_remaining_today',
    'full_graph_daily_refresh',v_complete,
    'identity_graph',v_graph_status,'external_fetch_performed',false,
    'provider_messages_sent',0,'executed_at',v_started);
END;
$pulse$;

-- Internal scheduler only. Never expose a privileged public API for contacts.
REVOKE ALL ON FUNCTION public.powerhouse_connection_daily_pulse_v1(date,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_connection_daily_pulse_v1(date,integer)
  TO postgres;

-- Change an existing scheduled owner; do NOT create a duplicate job.
-- Every 10 minutes gives 72k record reviews/day capacity at 500 per slice;
-- the preexisting identity-graph run remains at minute 32 hourly.
SELECT cron.alter_job(
  138,
  schedule => '2,12,22,32,42,52 * * * *',
  command => $cron$
    SELECT public.powerhouse_connection_daily_pulse_v1(
      (now() AT TIME ZONE 'Europe/Amsterdam')::date, 500
    );
  $cron$
);
