-- P0 #4198: one bounded guardian ON the already existing #171 email watchdog.
-- No cron, sender, provider fallback, new data store, or weakening of recipient authority.
BEGIN;

CREATE OR REPLACE FUNCTION public.powerhouse_original_result_guardian_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $guardian$
DECLARE
  v_now timestamptz := COALESCE(NEW.gemeten_op,clock_timestamp());
  v_day date := (COALESCE(NEW.gemeten_op,clock_timestamp()) AT TIME ZONE 'Europe/Amsterdam')::date;
  v_hour text := to_char(COALESCE(NEW.gemeten_op,clock_timestamp()) AT TIME ZONE 'UTC','YYYYMMDDHH24');
  v_event_key text;
  v_held int := 0;
  v_ready int := 0;
  v_uncertain int := 0;
  v_today_candidates int := 0;
  v_yesterday_obligations int := 0;
  v_yesterday_missing int := 0;
  v_handoff_broken int := 0;
  v_research_tracked int := 0;
  v_research_consumed int := 0;
  v_already_checked boolean := false;
  v_recovery_attempted boolean := false;
  v_recovery_created int := 0;
  v_recovery_error text;
  v_recovery jsonb := '{}'::jsonb;
  v_state text;
  v_snapshot jsonb;
BEGIN
  -- Reject noncanonical/forged watchdog rows; the table has no anon/authenticated INSERT.
  IF NEW.onderdeel IS DISTINCT FROM 'powerhouse-email-executor'
    OR NEW.soort IS DISTINCT FROM 'autonomous-email-execution'
    OR NEW.gegevens->>'contract' IS DISTINCT FROM 'powerhouse-email-execution-watchdog-v1'
  THEN
    RETURN NEW;
  END IF;

  IF NOT pg_try_advisory_xact_lock(hashtextextended('powerhouse:original-result-guardian-v1',0)) THEN
    NEW.gegevens := NEW.gegevens || jsonb_build_object(
      'result_guardian',jsonb_build_object('state','BUSY','single_existing_owner',true));
    RETURN NEW;
  END IF;

  -- Read only original actions and original independent-result observations.
  SELECT
    count(*) FILTER (WHERE a.status IN ('prepared','waiting')
      AND a.evidence#>>'{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'),
    count(*) FILTER (WHERE a.status='prepared'
      AND coalesce(a.evidence#>>'{execution_gate,reason}','')<>'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
      AND coalesce(a.evidence->>'send_forbidden','false')<>'true'),
    count(*) FILTER (WHERE a.status IN ('prepared','waiting')
      AND (a.evidence#>>'{autonomous_outbound,needs_readback}'='true'
        OR a.evidence#>>'{autonomous_outbound,republish_forbidden}'='true'
        OR a.evidence#>>'{provider_ambiguity_quarantine,external_resend_forbidden}'='true'
        OR nullif(a.evidence#>>'{autonomous_outbound,provider_message_id}','') IS NOT NULL))
  INTO v_held,v_ready,v_uncertain
  FROM public.powerhouse_sales_actions a
  WHERE a.action_type='autonomous_email'
    AND a.channel='email'
    AND a.created_at>=v_now-interval '72 hours';

  SELECT count(*) INTO v_today_candidates
  FROM public.powerhouse_sales_actions a
  WHERE a.action_type='autonomous_email' AND a.channel='email'
    AND a.dedupe_key LIKE 'connection-email-activation:'||v_day::text||':%';

  SELECT
    count(*)::int,
    count(*) FILTER (WHERE
      status NOT IN ('LIVE_PROVEN','MEASURED','LEARNED')
      OR live_proven_at IS NULL)::int
  INTO v_yesterday_obligations,v_yesterday_missing
  FROM public.content_publication_obligations
  WHERE publication_date=v_day-1 AND channel IN ('blog','instagram','linkedin_personal','linkedin_company');

  -- The existing email watchdog has already measured this original seven-day cohort.
  v_handoff_broken := greatest(0,coalesce(
    nullif(NEW.gegevens#>>'{original_handoff_scorecard_7d,broken_or_unproven_handoffs_7d}','')::int,0));

  -- Source-vs-consumer acknowledgements: receipt != processed.
  SELECT
    coalesce(nullif(e.evidence#>>'{research_handoff_receipt,tracked}','')::int,0),
    coalesce(nullif(e.evidence#>>'{research_handoff_receipt,consumer_receipts}','')::int,0)
  INTO v_research_tracked,v_research_consumed
  FROM public.powerhouse_runtime_events e
  WHERE e.subject_key='powerhouse_dispatch_relationship_public_research_v1'
    AND e.event_type='commercial_stage_execution'
    AND e.occurred_at>=v_now-interval '3 hours'
  ORDER BY e.occurred_at DESC LIMIT 1;
  v_research_tracked := coalesce(v_research_tracked,0);
  v_research_consumed := coalesce(v_research_consumed,0);

  v_event_key := 'original-result-guardian:'||v_hour||':commercial';
  SELECT EXISTS (SELECT 1 FROM public.powerhouse_runtime_events
                 WHERE dedupe_key=v_event_key)
    INTO v_already_checked;

  -- Automatic *safe* recovery: choose ONE other already-approved candidate via
  -- the ORIGINAL selector. It only prepares an action; the canonical composer,
  -- recipient lawfulness, suppression, pressure and original Gmail sender retain
  -- exclusive authorization. Never retry an uncertain provider side effect.
  -- Hourly dedupe + daily cap prevent a ten-minute watchdog from flooding the queue.
  IF NOT v_already_checked AND v_held>0 AND v_ready=0 AND v_uncertain=0
     AND v_today_candidates<5
     AND (v_now AT TIME ZONE 'Europe/Amsterdam')::time >= time '09:00'
  THEN
    v_recovery_attempted := true;
    BEGIN
      v_recovery := public.powerhouse_prepare_connection_email_activation_v1(v_day,1);
      v_recovery_created := least(1,greatest(0,coalesce((v_recovery->>'prepared')::int,0)));
    EXCEPTION WHEN OTHERS THEN
      v_recovery_error := left(SQLSTATE||':'||SQLERRM,240);
    END;
  END IF;

  v_state := CASE
    WHEN v_recovery_error IS NOT NULL THEN 'ERROR'
    WHEN v_held>0 OR v_handoff_broken>0 OR v_yesterday_missing>0
      OR v_research_tracked>v_research_consumed THEN 'DEGRADED'
    ELSE 'OBSERVED' END;
  v_snapshot := jsonb_build_object(
    'contract','powerhouse-original-result-guardian-v1',
    'state',v_state,
    'owner','existing-powerhouse-reliability',
    'canonical_scheduler','#171',
    'original_commercial_owner','#116',
    'original_content_owner','#140',
    'checked_at',v_now,
    'day',v_day,
    'held_source_specific',v_held,
    'prepared_without_source_hold',v_ready,
    'provider_uncertain_no_resend',v_uncertain,
    'original_daily_candidates',v_today_candidates,
    'daily_candidate_cap',5,
    'last_day_channel_obligations',v_yesterday_obligations,
    'last_day_missing_live_proof',v_yesterday_missing,
    'broken_email_handoffs_7d',v_handoff_broken,
    'research_tracked',v_research_tracked,
    'research_consumer_receipts',v_research_consumed,
    'original_fallback_evaluated',NOT v_already_checked,
    'fallback_attempted',v_recovery_attempted,
    'fallback_prepared',v_recovery_created,
    'fallback_error',v_recovery_error,
    'next_owner',CASE WHEN v_recovery_created>0 THEN 'original-commercial-composer'
                      WHEN v_held>0 THEN 'original-relationship-public-research'
                      ELSE 'original-commercial-owner' END,
    'repair_policy',CASE WHEN v_recovery_created>0 THEN 'NEXT_ORIGINAL_NATURAL_RUN'
                         WHEN v_held>0 THEN 'SOURCE_UNVERIFIED_KEEP_HOLD_AND_RESEARCH_DUE_ONLY'
                         ELSE 'OBSERVE_ORIGINAL_OWNERS' END,
    'provider_send_attempted',false,
    'provider_result_proven_by_guardian',false,
    'release_green_proven',false
  );

  -- Existing event store, one hourly idempotency key; no parallel task queue.
  IF NOT v_already_checked THEN
    INSERT INTO public.powerhouse_runtime_events(
      dedupe_key,event_type,source,subject_key,occurred_at,
      evidence,context,state,data_quality,confidence,updated_at)
    VALUES(
      v_event_key,'original_result_guardian_observation',
      'powerhouse-original-result-guardian-v1','commercial-result-guard',v_now,
      v_snapshot,
      jsonb_build_object('owner','existing-powerhouse-reliability',
                         'original_issue',4198,'single_runtime',true),
      CASE WHEN v_state='ERROR' THEN 'error' ELSE 'observed' END,
      'OBSERVED',1,v_now)
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;

  NEW.gegevens := coalesce(NEW.gegevens,'{}'::jsonb)
    || jsonb_build_object('result_guardian',v_snapshot);
  IF v_state IN ('ERROR','DEGRADED')
     AND (v_held>0 OR v_handoff_broken>0 OR v_recovery_error IS NOT NULL)
  THEN
    NEW.status := 'fout';
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Preserve watchdog liveness, never declare a failed guardian GREEN.
  NEW.status := 'fout';
  NEW.gegevens := coalesce(NEW.gegevens,'{}'::jsonb) || jsonb_build_object(
    'result_guardian',jsonb_build_object(
      'contract','powerhouse-original-result-guardian-v1',
      'state','ERROR','checked_at',clock_timestamp(),
      'error',left(SQLSTATE||':'||SQLERRM,240),
      'recovery_owner','existing-powerhouse-reliability',
      'provider_send_attempted',false));
  RETURN NEW;
END;
$guardian$;

REVOKE ALL ON FUNCTION public.powerhouse_original_result_guardian_v1()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_original_result_guardian_v1()
TO service_role;

DROP TRIGGER IF EXISTS powerhouse_original_result_guardian_on_existing_watchdog
ON public.bg_gezondheid;
CREATE TRIGGER powerhouse_original_result_guardian_on_existing_watchdog
BEFORE INSERT ON public.bg_gezondheid
FOR EACH ROW
WHEN (NEW.onderdeel='powerhouse-email-executor'
      AND NEW.soort='autonomous-email-execution')
EXECUTE FUNCTION public.powerhouse_original_result_guardian_v1();

COMMENT ON FUNCTION public.powerhouse_original_result_guardian_v1()
IS 'Existing #171 watchdog-hook recovery: once-hourly bounded original-selector fallback and independent no-false-green evidence; never sends email or creates scheduler.';
COMMIT;
