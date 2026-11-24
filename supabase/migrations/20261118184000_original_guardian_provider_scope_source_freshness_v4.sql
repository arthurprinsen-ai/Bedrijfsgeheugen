-- Original P0 #4198. Same existing #171 result guardian; historical failure scope,
-- actual post-error source freshness and approved exact-key recovery truth.
-- Owner provided private paid account screenshots. Never persist balances here.
-- No new scheduler, sender, API request, secret read or automatic payment.
BEGIN;
CREATE OR REPLACE FUNCTION public.powerhouse_original_result_guardian_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
  v_news_last_ingest timestamptz;
  v_news_last_provider_ok timestamptz;
  v_news_cron_last_run timestamptz;
  v_news_plan_limit_hit boolean := false;
  v_news_last_432_at timestamptz;
  v_news_ingests_after_432 integer := 0;
  v_news_basic_match_after_432 integer := 0;
  v_openai_last_failed_at text;
  v_news_stale boolean := false;
  v_openai_quota boolean := false;
  v_openai_retry_after text;
  v_owner_actions jsonb := '[]'::jsonb;
  v_owner_item jsonb;
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

  -- Independent source truth: job #20 SQL success is NOT Tavily provider success.
  -- Tavily HTTP 432 means PLAN LIMIT; never retry until allowance is restored.
  SELECT max(opgehaald_op) INTO v_news_last_ingest FROM public.bg_bedrijfsnieuws;
  SELECT max(gemeten_op) INTO v_news_last_provider_ok
  FROM public.bg_gezondheid
  WHERE onderdeel='bg-bedrijfsnieuws' AND status='ok';
  SELECT max(start_time) INTO v_news_cron_last_run
  FROM cron.job_run_details WHERE jobid=20 AND status='succeeded';
  -- A failed request in a 36-hour window is historical provider evidence,
  -- NOT proof that the current paid account still lacks plan capacity.
  SELECT max(r.created) INTO v_news_last_432_at
  FROM net._http_response r
  WHERE r.created >= v_now-interval '36 hours'
    AND r.status_code=500 AND r.content LIKE '%TAVILY_432%';
  v_news_plan_limit_hit := v_news_last_432_at IS NOT NULL;
  -- New ingestion may be another authorized source. Even a row passing
  -- base relevance filters is not a native #20 Tavily recovery receipt.
  IF v_news_plan_limit_hit THEN
    SELECT count(*)::int,
           count(*) FILTER (
             WHERE over_dit_bedrijf IS TRUE AND zekerheid >= 0.8
               AND nullif(btrim(coalesce(afgewezen_reden,'')),'') IS NULL
           )::int
    INTO v_news_ingests_after_432,v_news_basic_match_after_432
    FROM public.bg_bedrijfsnieuws
    WHERE opgehaald_op > v_news_last_432_at;
  END IF;
  v_news_stale := v_news_cron_last_run>=v_now-interval '36 hours'
    AND (v_news_last_ingest IS NULL OR v_news_last_ingest<v_now-interval '72 hours')
    AND (v_news_last_provider_ok IS NULL OR v_news_last_provider_ok<v_now-interval '72 hours');

  -- Original native provider owner escalation, preserving the SAME #171 owner.
  -- Paid provider account status is owner reported, not independently verified.
  SELECT coalesce(
    d.delivery_evidence#>>'{artifact_generation_failure,classification}'='PROVIDER_BILLING'
      AND lower(coalesce(d.delivery_evidence#>>'{artifact_generation_failure,reason}',''))
          LIKE '%insufficient_quota%',false),
    d.delivery_evidence#>>'{artifact_generation_failure,retry_after}',
    d.delivery_evidence#>>'{artifact_generation_failure,last_failed_at}'
  INTO v_openai_quota,v_openai_retry_after,v_openai_last_failed_at
  FROM public.powerhouse_channel_decisions d
  LEFT JOIN public.content_publication_obligations o
    ON o.publication_date=d.run_date AND o.channel='linkedin_personal'
  WHERE d.run_date=v_day AND d.channel='linkedin_personal'
    AND coalesce(o.status,'') NOT IN ('LIVE_PROVEN','MEASURED','LEARNED')
    AND nullif(coalesce(o.external_id,''),'') IS NULL
  LIMIT 1;
  v_openai_quota := coalesce(v_openai_quota,false);

  IF v_news_plan_limit_hit THEN
    v_owner_actions := v_owner_actions || jsonb_build_array(jsonb_build_object(
      'fingerprint','tavily-432-original-news','provider','Tavily',
      'code','TAVILY_432','severity','ACTION_REQUIRED',
      'owner','existing-bg-bedrijfsnieuws-20',
      'impact',format('Laatste originele Tavily-aanvraag gaf HTTP432; sindsdien %s nieuwe nieuwsrijen (%s voldoen aan basisfilters). Ingestie is geen herstelbewijs van dezelfde Tavily-verbinding; e-mail blijft op afzonderlijke bron-/toestemmingspoort.',
                      v_news_ingests_after_432,v_news_basic_match_after_432),
      'last_failed_at',v_news_last_432_at,
      'ingests_after_failure',v_news_ingests_after_432,
      'base_matches_after_failure',v_news_basic_match_after_432,
      'failure_last_observed_not_currently_reproven',true,
      'original_provider_recovery_verified',false,
      'paid_account_reported',true,
      'paid_or_unpaid_independently_verified',false,
      'human_action','Bestaande bronagent: controleer veilig of oorspronkelijke sleutel bij betaalde Tavily-workspace en juiste plan/PAYG-scope hoort; alleen accountbeheerder kan ontbrekende providerautorisatie herstellen; geen extra betaling veronderstellen.',
      'action_url','https://help.tavily.com/articles/8645538886-understanding-http-errors',
      'notification_sent',false,'delivery_proof','NOT_SENT_BY_GUARDIAN',
      'incident_url','https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198'));
  END IF;
  IF v_openai_quota THEN
    v_owner_actions := v_owner_actions || jsonb_build_array(jsonb_build_object(
      'fingerprint','openai-429-personal-original','provider','OpenAI',
      'code','429 insufficient_quota','severity','ACTION_REQUIRED',
      'owner','original-personal-content-orchestrator',
      'impact','Persoonlijke LinkedIn-post nog niet providerbewezen',
      'paid_account_reported',true,
      'paid_or_unpaid_independently_verified',false,
      'retry_after',v_openai_retry_after,
      'last_failed_at',v_openai_last_failed_at,
      'failure_last_observed_not_currently_reproven',true,
      'original_personal_generator_recovery_verified',false,
      'human_action','Bestaande persoonlijke executor: verifieer na oorspronkelijke cooldown dezelfde OpenAI API-key en gebonden org/project en projectbudget; eigenaar toont positief API-tegoed. Geen nieuwe betaling, alternatieve ongeautoriseerde sleutel of voortijdige repost.',
      'action_url','https://platform.openai.com/settings/organization/billing/',
      'notification_sent',false,'delivery_proof','NOT_SENT_BY_GUARDIAN',
      'incident_url','https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198'));
  END IF;

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
     AND NOT v_news_plan_limit_hit
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
    WHEN v_openai_quota OR v_news_plan_limit_hit OR v_news_stale OR v_held>0 OR v_handoff_broken>0 OR v_yesterday_missing>0
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
    'news_source_provider_state',CASE WHEN v_news_plan_limit_hit THEN 'TAVILY_PLAN_LIMIT_EXCEEDED' WHEN v_news_stale THEN 'PROVIDER_NEWS_INGEST_STALE' ELSE 'NO_NEW_SOURCE_FAILURE_OBSERVED' END,
    'news_source_error_scope','HISTORICAL_PROVIDER_FAILURE_CURRENT_HEALTH_UNVERIFIED',
    'news_source_last_432_at',v_news_last_432_at,
    'news_source_ingests_after_last_432',v_news_ingests_after_432,
    'news_source_base_matches_after_last_432',v_news_basic_match_after_432,
    'news_ingestion_not_sufficient_for_original_tavily_recovery',true,
    'openai_personal_last_429_at',v_openai_last_failed_at,
    'openai_personal_recovery_unverified',v_openai_quota,
    'news_source_cron20_last_run',v_news_cron_last_run,
    'news_source_last_ingest',v_news_last_ingest,
    'news_source_last_successful_provider_health',v_news_last_provider_ok,
    'news_source_owner','existing-bg-bedrijfsnieuws-20',
    'news_source_failure_independently_observed',v_news_plan_limit_hit OR v_news_stale,
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
    'news_quota_no_redundant_retry',v_news_plan_limit_hit,
    'provider_result_proven_by_guardian',false,
    'release_green_proven',false
  );

  -- Owner action event is NOT a delivered message: one deduplicated event
  -- per original provider fingerprint/day; existing scheduled tasks deliver.
  v_snapshot := v_snapshot || jsonb_build_object(
    'owner_action_due',v_owner_actions,
    'owner_action_delivery',jsonb_build_object(
      'state',CASE WHEN jsonb_array_length(v_owner_actions)>0 THEN 'PENDING_VERIFIED_OWNER_NOTIFICATION' ELSE 'NONE' END,
      'notification_sent',false,
      'delivery_proof','NOT_SENT_BY_GUARDIAN',
      'independent_owner_task_receipt_required',true));
  FOR v_owner_item IN SELECT value FROM jsonb_array_elements(v_owner_actions) LOOP
    INSERT INTO public.powerhouse_runtime_events(
      dedupe_key,event_type,source,subject_key,occurred_at,
      evidence,context,state,data_quality,confidence,updated_at)
    VALUES(
      'original-owner-action:'||to_char(v_day,'YYYYMMDD')||':'||(v_owner_item->>'fingerprint'),
      'owner_action_required','powerhouse-original-result-guardian-v1',
      'original-provider-owner-notification',v_now,v_owner_item,
      jsonb_build_object('owner','existing-powerhouse-reliability',
                         'original_issue',4198,'original_scheduler','#171',
                         'alert_delivery_is_not_assumed',true),
      'observed','OBSERVED',1,v_now)
    ON CONFLICT (dedupe_key) DO NOTHING;
  END LOOP;

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
     AND (v_held>0 OR v_handoff_broken>0 OR v_recovery_error IS NOT NULL OR v_news_plan_limit_hit OR v_news_stale OR v_openai_quota)
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
$function$
;
REVOKE ALL ON FUNCTION public.powerhouse_original_result_guardian_v1()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_original_result_guardian_v1()
  TO service_role;
COMMENT ON FUNCTION public.powerhouse_original_result_guardian_v1()
IS 'Original #171 v4: distinguish observed Tavily 432 and OpenAI personal 429 from currently verified API health; count later independent news rows without false recovery or sending.';
COMMIT;
