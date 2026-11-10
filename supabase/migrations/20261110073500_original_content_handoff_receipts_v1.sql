-- ORIGINAL ONE BRAIN: each handoff remains OPEN until exact recipient proof.
-- The EXISTING runtime mux #171 calls the EXISTING loop assurance owner.
-- No new scheduler, email sender, social post or fabricated metric.
CREATE OR REPLACE FUNCTION public.powerhouse_content_handoff_receipts_v1(
  p_now timestamptz DEFAULT now()
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public'
AS $handoff$
DECLARE
  r public.content_publication_obligations%rowtype;
  v_day date:=(p_now at time zone 'Europe/Amsterdam')::date;
  v_pub boolean; v_metric boolean; v_analysis boolean; v_reuse boolean;
  v_stage text; v_owner text; v_event text; v_eval text; v_payload jsonb;
  v_pub_due timestamptz; v_metric_due timestamptz; v_due timestamptz;
  v_count integer:=0; v_open integer:=0; v_overdue integer:=0;
  v_email_due integer:=0; v_learning_overdue integer:=0;
BEGIN
  FOR r IN
    SELECT * FROM public.content_publication_obligations
    WHERE tenant_id='canonical'
      AND publication_date BETWEEN v_day-8 AND v_day
      AND channel IN ('blog','instagram','linkedin_company','linkedin_personal')
    ORDER BY publication_date,channel
  LOOP
    v_count:=v_count+1; v_event:=null; v_eval:=null;
    v_pub_due:=(r.publication_date::timestamp+interval '12 hours')
       AT TIME ZONE 'Europe/Amsterdam';
    v_pub:=coalesce(r.live_proven_at IS NOT NULL
       AND nullif(r.external_id,'') IS NOT NULL
       AND coalesce(r.canonical_url,'') LIKE 'https://%'
       AND r.status IN ('LIVE_PROVEN','MEASURED','LEARNED')
       AND (CASE WHEN r.channel='blog'
          THEN r.evidence->>'public_http_status'='200'
             AND nullif(r.evidence->>'netlify_deploy_id','') IS NOT NULL
          ELSE r.evidence->>'provider_truth_verified'='true' END),false);
    v_metric_due:=coalesce(r.live_proven_at,v_pub_due)+
      CASE WHEN r.channel='blog' THEN interval '8 days'
           ELSE interval '78 hours' END;
    v_metric:=false;v_analysis:=false;v_reuse:=false;
    IF v_pub AND r.channel='linkedin_company' THEN
      SELECT s.source_event_id INTO v_event
      FROM public.social_posts p
      JOIN public.social_metric_snapshots s
        ON s.tenant_id=p.tenant_id AND s.post_id=p.post_id
      WHERE p.tenant_id IN('bedrijfsgeheugen','canonical')
        AND p.channel_kind='linkedin_company'
        AND p.external_post_id=r.external_id
        AND s.source='windsor-linkedin-company'
        AND s.data_quality='PROVIDER_OBSERVED_LINKED'
        AND s.metrics->>'provider_post_urn'=r.external_id
        AND s.metrics->>'provider_organization_urn'='urn:li:organization:18234216'
        AND s.metrics->>'independent_proof'='EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'
        AND jsonb_typeof(s.metrics->'impressions')='number'
        AND s.observed_at >= r.live_proven_at+interval '24 hours'
        AND s.observed_at<=r.live_proven_at+interval '8 days'
        AND s.observed_at<=p_now AND nullif(s.source_event_id,'') IS NOT NULL
      ORDER BY s.observed_at DESC LIMIT 1;
      v_metric:=v_event IS NOT NULL;
      IF v_metric THEN
        SELECT e.evaluation_id INTO v_eval
        FROM public.social_learning_applications a
        JOIN public.social_learning_evaluations e
          ON e.tenant_id=a.tenant_id AND e.post_id=a.post_id
         AND e.evidence->>'application_id'=a.application_id
         AND e.evidence->>'source_event_id'=v_event
        JOIN public.social_posts p
          ON p.post_id=a.post_id AND p.tenant_id=a.tenant_id
        WHERE p.external_post_id=r.external_id
          AND a.application_role='ORIGINAL_EXPERIMENT_VARIANT_PROVIDER_PROVEN'
          AND e.metric_vector->>'metric_scope'='DESCRIPTIVE_EXPOSURE_NOT_CAUSAL_LIFT'
        ORDER BY e.observed_at DESC LIMIT 1;
        v_analysis:=v_eval IS NOT NULL;
      END IF;
    ELSIF v_pub AND r.channel='blog' THEN
      v_metric:=coalesce(r.measured_at IS NOT NULL
        AND r.metrics ? 'window_start' AND r.metrics ? 'window_end'
        AND r.metrics->>'data_quality' NOT IN('UNVERIFIED','INSUFFICIENT_DATA'),false);
      IF v_metric THEN
        v_event:='ga4:'||r.metrics->>'window_start'||':'||r.metrics->>'window_end';
        v_eval:=nullif(r.evidence->>'analysis_receipt_id','');
        v_analysis:=v_eval IS NOT NULL;
      END IF;
    ELSIF v_pub THEN
      -- Other social lanes must provide their own independently linked
      -- measurement and analysis; cron success is not a consumer receipt.
      v_metric:=coalesce(r.measured_at IS NOT NULL
        AND nullif(r.evidence->>'measurement_source_event_id','') IS NOT NULL
        AND r.evidence->>'measurement_provider_verified'='true',false);
      IF v_metric THEN
        v_event:=r.evidence->>'measurement_source_event_id';
        v_eval:=nullif(r.evidence->>'analysis_receipt_id','');
        v_analysis:=v_eval IS NOT NULL;
      END IF;
    END IF;
    IF v_analysis AND r.learned_at IS NOT NULL
       AND r.evidence->>'learning_applied_verified'='true'
       AND nullif(r.evidence->>'learning_application_external_id','') IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM public.content_publication_obligations n
        WHERE n.tenant_id='canonical'
          AND n.external_id=r.evidence->>'learning_application_external_id'
          AND n.external_id<>r.external_id
          AND n.live_proven_at>r.live_proven_at
          AND n.live_proven_at<=p_now
          AND n.status IN('LIVE_PROVEN','MEASURED','LEARNED')
          AND n.evidence->>'provider_truth_verified'='true'
          -- Consumer must independently ACK the source provider object and
          -- original BRAIN evaluation. A producer's assertion alone is not proof.
          AND n.evidence->>'learning_source_external_id'=r.external_id
          AND n.evidence->>'learning_source_evaluation_id'=v_eval
      ) INTO v_reuse;
    END IF;
    IF NOT v_pub THEN
      v_stage:=CASE WHEN p_now>v_pub_due THEN 'OVERDUE_PUBLICATION' ELSE 'WAIT_PUBLICATION' END;
      v_owner:=CASE r.channel
       WHEN 'blog' THEN 'powerhouse-blog-queue / original protected blog writer'
       WHEN 'instagram' THEN 'powerhouse-mira-problem-radar / original media router'
       ELSE 'powerhouse-content-orchestrator / original social publisher' END;
      v_due:=v_pub_due;
    ELSIF NOT v_metric THEN
      v_stage:=CASE WHEN p_now>v_metric_due THEN 'OVERDUE_MEASUREMENT' ELSE 'WAIT_MEASUREMENT' END;
      v_owner:=CASE WHEN r.channel='blog' THEN 'powerhouse_measure_content_outcomes_v1'
                    ELSE 'bg-social-metrics-sync / original channel metric owner' END;
      v_due:=v_metric_due;
    ELSIF NOT v_analysis THEN
      v_stage:=CASE WHEN p_now>v_metric_due+interval '48 hours'
                    THEN 'OVERDUE_ANALYSIS' ELSE 'WAIT_ANALYSIS' END;
      v_owner:='powerhouse-runtime-scheduler-mux-v1 / original BRAIN learning owner';
      v_due:=v_metric_due+interval '48 hours';
    ELSIF NOT v_reuse THEN
      v_stage:='WAIT_NEXT_PROVIDER_PROVEN_EXPERIMENT';
      v_owner:='powerhouse-content-orchestrator / original CRO experiment owner';
      v_due:=NULL;
    ELSE
      v_stage:='PROVEN_NEXT_EXPERIMENT_HANDOFF';
      v_owner:='powerhouse-content-orchestrator / original CRO experiment owner';
      v_due:=NULL;
    END IF;
    IF v_stage LIKE 'OVERDUE_%' THEN v_overdue:=v_overdue+1; END IF;
    IF NOT v_reuse THEN v_open:=v_open+1; END IF;
    v_payload:=jsonb_build_object(
     'contract','original-content-handoff-receipts-v1',
     'stage',v_stage,'channel',r.channel,'publication_date',r.publication_date,
     'producer',jsonb_build_object('verified',v_pub,'provider_id',r.external_id,
        'url',r.canonical_url,'live_proven_at',r.live_proven_at),
     'measurement_consumer',jsonb_build_object('accepted',v_metric,
        'source_event_id',v_event,'measured_at',r.measured_at),
     'analysis_consumer',jsonb_build_object('accepted',v_analysis,'evaluation_id',v_eval),
     'experiment_consumer',jsonb_build_object('accepted',v_reuse,
        'next_provider_id',r.evidence->>'learning_application_external_id'),
     'due_at',v_due,'owner',v_owner,'next_action',r.next_action,
     'publication_side_effect_must_not_repeat',true,'causal_winner_not_assumed',true);
    INSERT INTO public.brain_obligations(
     obligation_type,capability_id,business_entity,business_period,business_timezone,
     payload_sha256,change_id,owner,state,evidence,created_at,updated_at,version)
    VALUES(
     'CONTENT_HANDOFF','content:'||r.channel,'original-provider-to-learning-chain',
     r.publication_date::text,'Europe/Amsterdam',
     md5('original-content-handoff|'||r.channel||'|'||r.publication_date::text),
     'original-content-handoff-receipts-v1',v_owner,
     CASE WHEN v_reuse THEN 'FULFILLED' ELSE 'OPEN' END,
     v_payload,p_now,p_now,1)
    ON CONFLICT(obligation_type,capability_id,business_entity,business_period,business_timezone)
    DO UPDATE SET owner=excluded.owner,state=excluded.state,evidence=excluded.evidence,
      updated_at=excluded.updated_at,version=public.brain_obligations.version+1
    WHERE public.brain_obligations.owner IS DISTINCT FROM excluded.owner
       OR public.brain_obligations.state IS DISTINCT FROM excluded.state
       OR public.brain_obligations.evidence IS DISTINCT FROM excluded.evidence;
  END LOOP;
  SELECT count(*) INTO v_email_due
  FROM public.powerhouse_sales_actions
  WHERE channel='email' AND status='prepared' AND due_at<=p_now;
  v_payload:=jsonb_build_object(
    'contract','original-content-handoff-receipts-v1','stage','WAIT_AUTHORIZED_EMAIL_SENDER',
    'due_prepared_actions',v_email_due,'exact_owner','canonical email consent and suppression owner',
    'provider_message_id',null,'send_proven',false,
    'no_sending_without_optin',true,
    'next_action','VERIFY_EXISTING_CANONICAL_SENDER_OPT_IN_SUPPRESSION_AND_INDEPENDENT_GMAIL_READBACK');
  INSERT INTO public.brain_obligations(
    obligation_type,capability_id,business_entity,business_period,business_timezone,
    payload_sha256,change_id,owner,state,evidence,created_at,updated_at,version)
  VALUES('CONTENT_HANDOFF','content:email_newsletter','original-provider-to-learning-chain',
    v_day::text,'Europe/Amsterdam',md5('original-content-handoff|email|'||v_day::text),
    'original-content-handoff-receipts-v1','canonical email consent and suppression owner',
    'OPEN',v_payload,p_now,p_now,1)
  ON CONFLICT(obligation_type,capability_id,business_entity,business_period,business_timezone)
  DO UPDATE SET evidence=excluded.evidence,updated_at=excluded.updated_at,
    version=public.brain_obligations.version+1
  WHERE public.brain_obligations.evidence IS DISTINCT FROM excluded.evidence;
  SELECT count(*) INTO v_learning_overdue
  FROM public.social_learning_obligations WHERE status='OPEN' AND due_at<p_now;
  v_payload:=jsonb_build_object('contract','original-content-handoff-receipts-v1',
    'stage',CASE WHEN v_learning_overdue>0 THEN 'OVERDUE_LEARNING_RECEIPTS' ELSE 'UP_TO_DATE' END,
    'overdue',v_learning_overdue,'next_owner','POWERHOUSE_SOCIAL_LEARNING',
    'no_mass_closure_without_source_proof',true);
  INSERT INTO public.brain_obligations(
    obligation_type,capability_id,business_entity,business_period,business_timezone,
    payload_sha256,change_id,owner,state,evidence,created_at,updated_at,version)
  VALUES('CONTENT_HANDOFF','social-learning-backlog',
    'original-provider-to-learning-chain','continuous','Europe/Amsterdam',
    md5('original-social-learning-backlog'),'original-content-handoff-receipts-v1',
    'POWERHOUSE_SOCIAL_LEARNING',CASE WHEN v_learning_overdue>0 THEN 'OPEN' ELSE 'FULFILLED' END,
    v_payload,p_now,p_now,1)
  ON CONFLICT(obligation_type,capability_id,business_entity,business_period,business_timezone)
  DO UPDATE SET state=excluded.state,evidence=excluded.evidence,updated_at=excluded.updated_at,
    version=public.brain_obligations.version+1
  WHERE public.brain_obligations.state IS DISTINCT FROM excluded.state
     OR public.brain_obligations.evidence IS DISTINCT FROM excluded.evidence;
  INSERT INTO public.powerhouse_runtime_events(
   dedupe_key,event_type,source,subject_key,channel,occurred_at,
   evidence,context,state,created_at,updated_at)
  VALUES('original-handoff-assurance:'||to_char(date_trunc('hour',p_now),'YYYYMMDDHH24'),
   'original_content_handoff_assurance','powerhouse-loop-assurance-v2',
   v_day::text,'internal',p_now,
   jsonb_build_object('contract','original-content-handoff-receipts-v1','tracked',v_count,
     'open',v_open,'overdue',v_overdue,'email_due',v_email_due,
     'social_learning_overdue',v_learning_overdue,
     'single_owner',true,'no_fake_close',true,'no_duplicate_send',true),
   jsonb_build_object('owner','existing powerhouse-runtime-scheduler-mux-v1',
                      'execution','READ_ONLY_PROOFS_AND_ORIGINAL_BRAIN_OBLIGATIONS'),
   CASE WHEN v_overdue>0 OR v_learning_overdue>0 THEN 'error'
        WHEN v_open>0 OR v_email_due>0 THEN 'observed' ELSE 'closed' END,
   p_now,p_now)
  ON CONFLICT(dedupe_key) DO UPDATE SET
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,updated_at=excluded.updated_at;
  RETURN jsonb_build_object('contract','original-content-handoff-receipts-v1',
    'tracked',v_count,'open',v_open,'overdue',v_overdue,
    'email_due',v_email_due,'social_learning_overdue',v_learning_overdue,
    'single_original_executor',true);
END;
$handoff$;
REVOKE ALL ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)
 TO service_role;
-- Existing original loop-assurance writer with ONE extra original readback.

CREATE OR REPLACE FUNCTION public.powerhouse_refresh_loop_assurance_v1(p_now timestamp with time zone DEFAULT now())
 RETURNS TABLE(out_loop_key text, out_status text, out_reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  r record;
  v_last_runtime timestamptz;
  v_scheduler_active boolean;
  v_required_count integer;
  v_fresh_stage_count integer;
  v_missing_stages text[];
  v_status text;
  v_reason text;
  v_next_expected timestamptz;
  v_window interval;
  v_guard_pass boolean;
  v_recovery_owner text;
  v_recovery_action text;
begin
  perform public.powerhouse_sync_loop_assurance_receipts_v1(p_now);
  -- Same original runtime #171 and original BRAIN assurance owner.
  -- This only checks per-channel receipts, never publishes or sends anything.
  perform public.powerhouse_content_handoff_receipts_v1(p_now);

  for r in
    select * from public.powerhouse_loop_assurance_registry_v1
    where active=true order by loop_key
  loop
    v_window := make_interval(mins => r.expected_cadence_minutes * 2);
    -- Routing belongs to the existing registry, NOT an invented second agent.
    v_recovery_owner := coalesce(nullif(r.evidence_contract->>'recovery_owner',''),'Powerhouse');
    v_recovery_action := coalesce(nullif(r.evidence_contract->>'recovery_action',''),
      'VERIFY_ORIGINAL_LOOP_OWNER_AND_RECEIPTS');

    if r.runtime_source is null then
      v_last_runtime := null;
    else
      select max(e.occurred_at) into v_last_runtime
      from public.powerhouse_runtime_events e
      where e.source=r.runtime_source;
    end if;

    if r.cron_jobname is null then
      v_scheduler_active := null;
    else
      select coalesce(bool_or(j.active),false) into v_scheduler_active
      from cron.job j where j.jobname=r.cron_jobname;
    end if;

    select cardinality(r.required_stages),
           count(*) filter (where rr.observed_at >= p_now-v_window),
           coalesce(array_agg(s.stage order by s.stage)
             filter (where rr.observed_at is null or rr.observed_at < p_now-v_window),'{}'::text[])
    into v_required_count,v_fresh_stage_count,v_missing_stages
    from unnest(r.required_stages) s(stage)
    left join public.powerhouse_loop_assurance_receipts_v1 rr
      on rr.loop_key=r.loop_key and rr.stage=s.stage;

    select case
             when rr.observed_at >= p_now-v_window and rr.evidence ? 'pass'
             then (rr.evidence->>'pass')::boolean
             else null
           end
    into v_guard_pass
    from public.powerhouse_loop_assurance_receipts_v1 rr
    where rr.loop_key=r.loop_key and rr.stage='guard'
    limit 1;

    if r.cron_jobname is not null and coalesce(v_scheduler_active,false)=false then
      v_status:='RED'; v_reason:='scheduler missing or inactive';
    elsif r.runtime_source is not null and v_last_runtime is null then
      v_status:='RED'; v_reason:='no runtime evidence';
    elsif r.runtime_source is not null and v_last_runtime < p_now-v_window then
      v_status:='RED'; v_reason:='runtime evidence stale beyond 2x cadence';
    elsif v_guard_pass is false then
      v_status:='RED'; v_reason:='fresh guard evidence reports unresolved failure or human boundary';
    elsif v_fresh_stage_count=0 and r.critical then
      v_status:='RED'; v_reason:='critical loop has zero fresh closed-loop stage evidence';
    elsif v_fresh_stage_count<v_required_count then
      v_status:='AMBER'; v_reason:='closed-loop stage evidence incomplete or stale';
    elsif r.runtime_source is not null and v_last_runtime < p_now-make_interval(mins=>r.expected_cadence_minutes) then
      v_status:='AMBER'; v_reason:='runtime evidence older than expected cadence';
    else
      v_status:='GREEN'; v_reason:='scheduler/runtime/stage evidence current';
    end if;

    v_next_expected := case
      when v_last_runtime is not null then v_last_runtime+make_interval(mins=>r.expected_cadence_minutes)
      else p_now+make_interval(mins=>r.expected_cadence_minutes)
    end;

    insert into public.powerhouse_loop_assurance_state_v1(
      loop_key,status,last_runtime_at,scheduler_active,fresh_stage_count,required_stage_count,
      missing_stages,next_expected_at,reason,checked_at,evidence
    ) values (
      r.loop_key,v_status,v_last_runtime,v_scheduler_active,v_fresh_stage_count,v_required_count,
      v_missing_stages,v_next_expected,v_reason,p_now,
      jsonb_build_object(
        'runtime_source',r.runtime_source,'cron_jobname',r.cron_jobname,
        'expected_cadence_minutes',r.expected_cadence_minutes,'critical',r.critical,
        'guard_pass',v_guard_pass,
        'recovery_owner',v_recovery_owner,
        'recovery_action',case when v_status='GREEN' then 'ASSURANCE_NO_REPAIR_REQUIRED' else v_recovery_action end,
        'recovery_owner_registered',r.evidence_contract ? 'recovery_owner',
        'receipt_sync','canonical-runtime-cron-and-explicit-guard'
      )
    )
    on conflict on constraint powerhouse_loop_assurance_state_v1_pkey do update set
      status=excluded.status,last_runtime_at=excluded.last_runtime_at,
      scheduler_active=excluded.scheduler_active,fresh_stage_count=excluded.fresh_stage_count,
      required_stage_count=excluded.required_stage_count,missing_stages=excluded.missing_stages,
      next_expected_at=excluded.next_expected_at,reason=excluded.reason,
      checked_at=excluded.checked_at,evidence=excluded.evidence;

    insert into public.brain_obligations(
      obligation_type,capability_id,business_entity,business_period,business_timezone,
      payload_sha256,change_id,owner,state,evidence,created_at,updated_at,version
    ) values (
      'OPERATIONS_ASSURANCE',r.loop_key,'powerhouse-loop-assurance-v2','continuous',
      'Europe/Amsterdam',md5(r.loop_key),'powerhouse-loop-assurance-v2',v_recovery_owner,
      case when v_status='GREEN' then 'FULFILLED' else 'OPEN' end,
      jsonb_build_object(
        'assurance_status',v_status,'reason',v_reason,'missing_stages',v_missing_stages,
        'guard_pass',v_guard_pass,
        'recovery_owner',v_recovery_owner,
        'recovery_action',case when v_status='GREEN' then 'ASSURANCE_NO_REPAIR_REQUIRED' else v_recovery_action end,
        'recovery_owner_registered',r.evidence_contract ? 'recovery_owner',
        'last_runtime_at',v_last_runtime,'next_expected_at',v_next_expected,'checked_at',p_now
      ),
      p_now,p_now,1
    )
    on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone)
    do update set
      state=excluded.state,owner=excluded.owner,evidence=excluded.evidence,updated_at=excluded.updated_at,
      version=public.brain_obligations.version+1;

    out_loop_key:=r.loop_key; out_status:=v_status; out_reason:=v_reason;
    return next;
  end loop;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,created_at,updated_at
  )
  select
    'loop-assurance:'||to_char(date_trunc('minute',p_now),'YYYYMMDDHH24MI'),
    'loop_assurance_refresh','powerhouse-loop-assurance-v2','all-active-loops','internal',p_now,
    jsonb_build_object(
      'green',count(*) filter(where s.status='GREEN'),
      'amber',count(*) filter(where s.status='AMBER'),
      'red',count(*) filter(where s.status='RED')
    ),
    jsonb_build_object('fingerprint','powerhouse-loop-assurance-v2','receipt_sync','canonical-runtime-cron-and-explicit-guard'),
    case when count(*) filter(where s.status='RED')>0 then 'error'
         when count(*) filter(where s.status='AMBER')>0 then 'observed'
         else 'closed' end,
    p_now,p_now
  from public.powerhouse_loop_assurance_state_v1 s
  on conflict(dedupe_key) do update set
    evidence=excluded.evidence,context=excluded.context,state=excluded.state,
    occurred_at=excluded.occurred_at,updated_at=excluded.updated_at;
end;
$function$

