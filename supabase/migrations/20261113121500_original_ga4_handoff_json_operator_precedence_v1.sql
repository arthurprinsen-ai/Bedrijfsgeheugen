-- Original ONE BRAIN content consumer #171: repair SQLSTATE 22P02 at exact GA4 receipt expression.
-- Source was independently compared byte-for-byte with ORIGINAL production function
-- as deployed via 20261113082500_original_cancelled_social_learning_source_ack_v1.sql.
-- Restore ONLY proper PostgreSQL JSON text accessor precedence; no owner/scheduler/side-effect changes.
-- DO NOT treat source ACK as provider publication, GA4 actual measurement, or causally proven learning.
-- Scoped P0 #4198; protected schema migration, no parallel writer.

CREATE OR REPLACE FUNCTION public.powerhouse_content_handoff_receipts_v1(p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  r public.content_publication_obligations%rowtype;
  mail record; v_mail_proven boolean; v_mail_reply boolean;
  v_day date:=(p_now at time zone 'Europe/Amsterdam')::date;
  v_pub boolean; v_metric boolean; v_analysis boolean; v_reuse boolean; v_no_publish boolean;
  v_stage text; v_owner text; v_event text; v_eval text; v_payload jsonb;
  v_learning_id text; v_eval_at timestamptz;
  v_metric_observed_at timestamptz;
  v_pub_due timestamptz; v_metric_due timestamptz; v_due timestamptz;
  v_count integer:=0; v_open integer:=0; v_overdue integer:=0;
  v_email_due integer:=0; v_learning_overdue integer:=0;
  v_learning_scanned integer:=0; v_unregistered_old integer:=0;
  v_legacy_source_acks integer:=0; v_legacy_consumer_acks integer:=0;
  v_cancelled_learning_source_acks integer:=0;
  slo public.social_learning_obligations%rowtype;
BEGIN
  -- Every recent publication stays under direct care; older unfinished
  -- obligations are replayed fairly, oldest *unaccepted* first, in a
  -- bounded batch, avoiding expensive full-historical writes per tick.
  -- No old item disappears merely because it aged beyond eight days.
  FOR r IN
    WITH recent AS (
      SELECT c.* FROM public.content_publication_obligations c
      WHERE c.tenant_id='canonical'
        AND c.publication_date BETWEEN v_day-8 AND v_day
        AND c.channel IN ('blog','instagram','linkedin_company','linkedin_personal')
    ), historic AS (
      SELECT c.*
      FROM public.content_publication_obligations c
      LEFT JOIN public.brain_obligations b
        ON b.obligation_type='CONTENT_HANDOFF'
       AND b.capability_id='content:'||c.channel
       AND b.business_entity='original-provider-to-learning-chain'
       AND b.business_period=c.publication_date::text
       AND b.business_timezone='Europe/Amsterdam'
      WHERE c.tenant_id='canonical'
        AND c.publication_date<v_day-8
        AND c.channel IN ('blog','instagram','linkedin_company','linkedin_personal')
        AND coalesce(b.state,'OPEN')<>'FULFILLED'
        -- Revisit a cancelled original veto only when the source changes;
        -- do not repeat settled historical rows every five-minute tick.
        AND (b.state IS DISTINCT FROM 'CANCELLED'
          -- Re-inspect the original terminal NO_PUBLISH exactly once if
          -- its consumer has no tenant, exact source revision, correlation
          -- or same-revision ACK. Never infer a new provider delivery.
          OR b.evidence->>'tenant_id' IS DISTINCT FROM c.tenant_id
          OR b.evidence->>'source_revision' IS DISTINCT FROM to_char(c.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
          OR b.evidence->>'source_correlation_id' IS DISTINCT FROM md5('original-content-handoff|'||c.channel||'|'||c.publication_date::text)
          OR b.evidence#>>'{consumer_ack,source_revision}' IS DISTINCT FROM to_char(c.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
          OR b.evidence->>'stage' IS DISTINCT FROM 'NO_PUBLISH_POLICY_ACK'
          OR NOT coalesce((c.status='SKIPPED'
         AND c.evidence->>'decision'='NO_PUBLISH'
         AND c.evidence#>>'{veto,active}'='true'
         AND nullif(btrim(coalesce(c.evidence->>'decision_code','')),'') IS NOT NULL
         AND nullif(btrim(coalesce(c.evidence->>'decided_at','')),'') IS NOT NULL
         AND nullif(btrim(coalesce(c.evidence->>'no_publish_reason','')),'') IS NOT NULL
         AND c.external_id IS NULL AND c.published_at IS NULL AND c.live_proven_at IS NULL
         AND coalesce(c.evidence->>'provider_truth_verified','false')<>'true'
         AND coalesce(c.evidence->>'reconciliation_required','false')<>'true'
         AND coalesce(c.evidence->>'possible_provider_side_effect','false')<>'true'
         AND nullif(c.evidence->>'source_state_conflict','') IS NULL),false))
      ORDER BY coalesce(b.updated_at,'epoch'::timestamptz),
               c.publication_date,c.channel
      LIMIT 48
    )
    SELECT * FROM recent
    UNION ALL
    SELECT * FROM historic
    ORDER BY publication_date,channel
  LOOP
    v_count:=v_count+1; v_event:=null; v_eval:=null; v_metric_observed_at:=null;
    v_learning_id:=null; v_eval_at:=null;
    v_pub_due:=(r.publication_date::timestamp+interval '12 hours')
       AT TIME ZONE 'Europe/Amsterdam';
    -- Blog publishing is an HTTP/deployment side effect, not a social-media
    -- provider post. An absent social external_id must not erase an independently
    -- verified Netlify deploy + exact first-party blog URL + HTTP 200.
    -- Social channels remain strictly guarded by provider ID and provider truth.
    v_pub:=coalesce(r.live_proven_at IS NOT NULL
       AND coalesce(r.canonical_url,'') LIKE 'https://%'
       AND r.status IN ('LIVE_PROVEN','MEASURED','LEARNED')
       AND (
         (r.channel='blog'
          AND r.canonical_url LIKE 'https://www.bedrijfsgeheugen.nl/blog/%'
          AND r.evidence->>'public_http_status'='200'
          AND nullif(r.evidence->>'netlify_deploy_id','') IS NOT NULL)
         OR
         (r.channel IN ('instagram','linkedin_company','linkedin_personal')
          AND nullif(r.external_id,'') IS NOT NULL
          AND r.evidence->>'provider_truth_verified'='true')
       ),false);
    v_metric_due:=coalesce(r.live_proven_at,v_pub_due)+
      CASE WHEN r.channel='blog' THEN interval '8 days'
           ELSE interval '78 hours' END;
    v_metric:=false;v_analysis:=false;v_reuse:=false;v_no_publish:=false;
    IF v_pub AND r.channel='linkedin_company' THEN
      -- The producer event ID and observed timestamp must be selected from
      -- the SAME authenticated, independently linked provider snapshot row.
      SELECT s.source_event_id,s.observed_at INTO v_event,v_metric_observed_at
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
        SELECT e.evaluation_id,a.learning_id,e.observed_at
          INTO v_eval,v_learning_id,v_eval_at
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
        v_event:='ga4:'||(r.metrics->>'window_start')||':'||(r.metrics->>'window_end');
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
    -- A later post must consume the exact ORIGINAL learning ID, and must
    -- have been assigned after this independently observed BRAIN evaluation.
    -- The later provider author and source/analysis ACK remain necessary.
    IF v_analysis AND r.learned_at IS NOT NULL
       AND r.evidence->>'learning_applied_verified'='true'
       AND nullif(v_learning_id,'') IS NOT NULL
       AND v_eval_at IS NOT NULL
       AND nullif(r.evidence->>'learning_application_external_id','') IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.social_learning_applications a2
        JOIN public.social_posts p2
          ON p2.tenant_id=a2.tenant_id AND p2.post_id=a2.post_id
        JOIN public.content_publication_obligations n
          ON n.tenant_id='canonical'
         AND n.channel='linkedin_company'
         AND n.external_id=p2.external_post_id
        WHERE a2.tenant_id IN ('canonical','bedrijfsgeheugen')
          AND a2.learning_id=v_learning_id
          AND a2.application_role='ORIGINAL_EXPERIMENT_VARIANT_PROVIDER_PROVEN'
          AND a2.post_id<>'linkedin-company:'||r.external_id
          AND a2.applied_at>v_eval_at
          AND p2.external_post_id=r.evidence->>'learning_application_external_id'
          AND n.external_id<>r.external_id
          AND n.live_proven_at>v_eval_at
          AND n.live_proven_at<=p_now
          AND n.status IN('LIVE_PROVEN','MEASURED','LEARNED')
          AND n.evidence->>'provider_truth_verified'='true'
          AND n.evidence->>'learning_source_external_id'=r.external_id
          AND n.evidence->>'learning_source_evaluation_id'=v_eval
      ) INTO v_reuse;
    END IF;
    -- Historical clean-slate SKIPPED may contradict a durable original provider
    -- reference. This is a provider-ID/readback obligation, NOT permission to
    -- replay publication, nor proof that this specific post is currently live.
    IF NOT v_pub
       AND r.status='SKIPPED'
       AND r.channel IN ('instagram','linkedin_company','linkedin_personal')
       AND r.evidence->>'source_state_conflict'='SKIPPED_WITH_ORIGINAL_PROVIDER_REFERENCE'
       AND r.evidence->>'reconciliation_required'='true'
       AND r.evidence->>'republish_forbidden'='true'
       AND (nullif(btrim(coalesce(r.external_id,'')),'') IS NOT NULL
            OR r.published_at IS NOT NULL OR r.live_proven_at IS NOT NULL) THEN
      v_stage:='OVERDUE_PROVIDER_READBACK';
      v_owner:='powerhouse-social-publisher / original provider account';
      v_due:=v_pub_due;
    -- The original contradictory SKIPPED/provider-reference branch above
    -- retains precedence: never create a second post after any side effect.
    ELSIF NOT v_pub AND coalesce((r.status='SKIPPED'
         AND r.evidence->>'decision'='NO_PUBLISH'
         AND r.evidence#>>'{veto,active}'='true'
         AND nullif(btrim(coalesce(r.evidence->>'decision_code','')),'') IS NOT NULL
         AND nullif(btrim(coalesce(r.evidence->>'decided_at','')),'') IS NOT NULL
         AND nullif(btrim(coalesce(r.evidence->>'no_publish_reason','')),'') IS NOT NULL
         AND r.external_id IS NULL AND r.published_at IS NULL AND r.live_proven_at IS NULL
         AND coalesce(r.evidence->>'provider_truth_verified','false')<>'true'
         AND coalesce(r.evidence->>'reconciliation_required','false')<>'true'
         AND coalesce(r.evidence->>'possible_provider_side_effect','false')<>'true'
         AND nullif(r.evidence->>'source_state_conflict','') IS NULL),false) THEN
      v_no_publish:=true;
      v_stage:='NO_PUBLISH_POLICY_ACK';
      v_owner:='powerhouse-content-loop';
      v_due:=NULL;
    ELSIF NOT v_pub THEN
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
    IF NOT v_reuse AND NOT v_no_publish THEN v_open:=v_open+1; END IF;
    v_payload:=jsonb_build_object(
     'contract','original-content-handoff-receipts-v1',
     'stage',v_stage,'channel',r.channel,'publication_date',r.publication_date,
     -- The source identity and revision are authoritative from the original
     -- canonical producer row, not inferred from a downstream status label.
     'tenant_id',r.tenant_id,
     'source_revision',to_char(r.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
     'source_record_key',r.tenant_id||'|'||r.channel||'|'||r.publication_date::text,
     'source_correlation_id',md5('original-content-handoff|'||r.channel||'|'||r.publication_date::text),
     -- This ACK means ONE BRAIN consumed this exact source snapshot. It
     -- does NOT imply provider send, metric acceptance, experiment or sale.
     'consumer_ack',jsonb_build_object(
       'accepted',true,'acceptance_scope','ORIGINAL_SOURCE_STATE_ONLY_NOT_PROVIDER_OUTCOME',
       'source_revision',to_char(r.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
       'source_correlation_id',md5('original-content-handoff|'||r.channel||'|'||r.publication_date::text),
       'owner',v_owner,'source_status',r.status,'stage',v_stage,
       'provider_proven',v_pub,'measurement_proven',v_metric,
       'experiment_proven',v_reuse,'no_publish_veto_accepted',v_no_publish),
     'producer',jsonb_build_object('verified',v_pub,'provider_id',r.external_id,
        'url',r.canonical_url,'live_proven_at',r.live_proven_at),
     'no_publish_consumer',jsonb_build_object(
       'accepted',v_no_publish,'source_status',r.status,
       'source_decision',CASE WHEN v_no_publish THEN 'NO_PUBLISH' ELSE null END,
       'source_decision_code',CASE WHEN v_no_publish THEN r.evidence->>'decision_code' ELSE null END,
       'source_decided_at',CASE WHEN v_no_publish THEN r.evidence->>'decided_at' ELSE null END,
       'source_veto',CASE WHEN v_no_publish THEN r.evidence->'veto' ELSE null END,
       'publication_proven',false,'provider_send_allowed',false,
       'measurement_or_learning_claimed',false),
     'measurement_consumer',jsonb_build_object('accepted',v_metric,
        'source_event_id',CASE WHEN v_metric THEN v_event ELSE null END,
        -- Never use the publication obligation's stale/no measured_at
        -- for a newer or different Windsor source_event_id. Required
        -- temporal join: event and observed_at come from one source row.
        'measured_at',CASE WHEN v_metric
           THEN coalesce(v_metric_observed_at,r.measured_at) ELSE null END,
        'source_time_contract','ORIGINAL_SOURCE_EVENT_AND_OBSERVED_AT_SAME_ROW_V1'),

     'analysis_consumer',jsonb_build_object('accepted',v_analysis,'evaluation_id',v_eval),
     'experiment_consumer',jsonb_build_object('accepted',v_reuse,
        'next_provider_id',r.evidence->>'learning_application_external_id'),
     'due_at',v_due,'owner',v_owner,
     -- Preserve the old producer hint separately, route actual consumer
     -- action to the stage owner, not back to a completed provider step.
     'source_next_action',r.next_action,
     'provider_reference_reconciliation',jsonb_build_object(
       'required',v_stage='OVERDUE_PROVIDER_READBACK',
       'source_status',r.status,
       'source_external_reference',r.external_id,
       'source_published_at',r.published_at,
       'source_live_proven_at',r.live_proven_at,
       'republish_forbidden',r.evidence->>'republish_forbidden'='true',
       'provider_readback_verified',false,
       'source_state_conflict',r.evidence->>'source_state_conflict',
       'original_owner','powerhouse-social-publisher / original provider account'),
     'next_action',CASE
       WHEN v_stage='NO_PUBLISH_POLICY_ACK'
         THEN 'NO_PUBLISH_VETO_ACK_TERMINAL_NO_PROVIDER_SEND'
       WHEN v_stage='OVERDUE_PROVIDER_READBACK'
         THEN 'ORIGINAL_EXACT_PROVIDER_OWNER_AND_POST_READBACK_REQUIRED:'||coalesce(r.external_id,'MISSING_SOURCE_REFERENCE')
       WHEN v_stage IN('WAIT_ANALYSIS','OVERDUE_ANALYSIS')
         THEN 'RUN_ORIGINAL_SOURCE_BOUND_BRAIN_ANALYSIS_ACK:'||coalesce(v_event,'MISSING_MEASUREMENT_SOURCE_EVENT')
       ELSE r.next_action END,
     'publication_side_effect_must_not_repeat',true,'causal_winner_not_assumed',true);
    INSERT INTO public.brain_obligations(
     obligation_type,capability_id,business_entity,business_period,business_timezone,
     payload_sha256,change_id,owner,state,evidence,created_at,updated_at,version)
    VALUES(
     'CONTENT_HANDOFF','content:'||r.channel,'original-provider-to-learning-chain',
     r.publication_date::text,'Europe/Amsterdam',
     md5('original-content-handoff|'||r.channel||'|'||r.publication_date::text),
     'original-content-handoff-receipts-v1',v_owner,
     CASE WHEN v_no_publish THEN 'CANCELLED'
          WHEN v_reuse THEN 'FULFILLED' ELSE 'OPEN' END,
     v_payload,p_now,p_now,1)
    ON CONFLICT(obligation_type,capability_id,business_entity,business_period,business_timezone)
    DO UPDATE SET owner=excluded.owner,state=excluded.state,evidence=excluded.evidence,
      updated_at=excluded.updated_at,version=public.brain_obligations.version+1
    WHERE public.brain_obligations.owner IS DISTINCT FROM excluded.owner
       OR public.brain_obligations.state IS DISTINCT FROM excluded.state
       OR public.brain_obligations.evidence IS DISTINCT FROM excluded.evidence
       -- Stale historical work gets a real reinspection receipt and rotates
       -- fairly; no needless mutations on an immediate duplicate invocation.
       OR (r.publication_date < v_day-8
           AND public.brain_obligations.updated_at < p_now-interval '6 hours');
  END LOOP;
  -- Each prepared/executed original email has its OWN idempotent consumer
  -- obligation. A sent Gmail message may be transport-proven but cannot
  -- become an automatic reply, measured experiment, learning or sale.
  FOR mail IN
    SELECT action_id,status,due_at,executed_at,evidence
    FROM public.powerhouse_sales_actions
    WHERE channel='email'
      AND (
        due_at BETWEEN p_now-interval '8 days' AND p_now
        OR executed_at BETWEEN p_now-interval '8 days' AND p_now
      )
    ORDER BY coalesce(executed_at,due_at) DESC
    LIMIT 150
  LOOP
    v_mail_proven:=coalesce(
      mail.status='done' AND mail.executed_at IS NOT NULL
      AND nullif(mail.evidence->>'provider_message_id','') IS NOT NULL
      AND mail.evidence->>'provider_ack_verified'='true'
      AND (
        mail.evidence->>'provider_readback_verified'='true'
        OR (
          mail.evidence#>>'{provider_delivery_readback,provider_message_id}'
             =mail.evidence->>'provider_message_id'
          AND mail.evidence#>>'{provider_delivery_readback,recipient_match}'='true'
          AND mail.evidence#>>'{provider_delivery_readback,gmail_label}'='SENT'
        )
      ),false);
    SELECT EXISTS (
      SELECT 1 FROM public.powerhouse_email_reply_events e
      WHERE e.action_id=mail.action_id AND e.occurred_at<=p_now
    ) INTO v_mail_reply;
    v_stage:=CASE
      WHEN v_mail_proven AND v_mail_reply THEN 'WAIT_EMAIL_EXPERIMENT_LEARNING'
      WHEN v_mail_proven THEN 'WAIT_EMAIL_REPLY_AND_OUTCOME_MEASUREMENT'
      WHEN mail.status='prepared' AND mail.due_at<=p_now THEN 'OVERDUE_AUTHORIZED_EMAIL_SEND'
      WHEN mail.status='done' THEN 'OVERDUE_INDEPENDENT_GMAIL_READBACK'
      ELSE 'WAIT_ORIGINAL_EMAIL_SEND' END;
    v_owner:=CASE WHEN v_mail_proven
      THEN 'powerhouse-commercial-learning-v1 / original email outcome owner'
      ELSE 'powerhouse-autonomous-outreach-dispatch-daily / canonical consent sender' END;
    v_payload:=jsonb_build_object(
      'contract','original-content-handoff-receipts-v1','stage',v_stage,
      'channel','email','action_id',mail.action_id,
      'provider_message_id',mail.evidence->>'provider_message_id',
      'provider_readback_accepted',v_mail_proven,
      'original_reply_observed',v_mail_reply,
      'next_owner',v_owner,
      'due_at',mail.due_at,
      'consent_not_inferred',true,
      'no_bogus_reply_or_order',true,
      'no_resend_on_ambiguous_provider_side_effect',true);
    INSERT INTO public.brain_obligations(
      obligation_type,capability_id,business_entity,business_period,
      business_timezone,payload_sha256,change_id,owner,state,evidence,
      created_at,updated_at,version)
    VALUES('CONTENT_HANDOFF','email-action:'||mail.action_id::text,
      'original-provider-to-learning-chain',
      coalesce((mail.due_at at time zone 'Europe/Amsterdam')::date,
               (mail.executed_at at time zone 'Europe/Amsterdam')::date)::text,
      'Europe/Amsterdam',
      md5('original-email-handoff|'||mail.action_id::text),
      'original-content-handoff-receipts-v1',
      v_owner,'OPEN',v_payload,p_now,p_now,1)
    ON CONFLICT(obligation_type,capability_id,business_entity,business_period,business_timezone)
    DO UPDATE SET owner=excluded.owner,evidence=excluded.evidence,updated_at=excluded.updated_at,
      version=public.brain_obligations.version+1
    WHERE public.brain_obligations.owner IS DISTINCT FROM excluded.owner
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
  -- The original aggregate counter is not sufficient: every previously
  -- unprocessed original learning obligation must be traceable and reoffered
  -- to its SAME owner. Keep provider work untouched; this is no fake reply
  -- or extra dispatcher.
  FOR slo IN
    SELECT x.* FROM public.social_learning_obligations x
    LEFT JOIN public.brain_obligations b
      ON b.obligation_type='CONTENT_HANDOFF'
     AND b.capability_id='social-learning:'||
       substr(md5(x.tenant_id||':'||x.obligation_id),1,32)
     AND b.business_entity='original-provider-to-learning-chain'
     AND b.business_period='continuous'
     AND b.business_timezone='Europe/Amsterdam'
    WHERE x.status='OPEN'
    ORDER BY coalesce(b.updated_at,'epoch'::timestamptz),
             x.due_at,x.tenant_id,x.obligation_id
    LIMIT 48
  LOOP
    v_learning_scanned:=v_learning_scanned+1;
    v_payload:=jsonb_build_object(
      'contract','original-content-handoff-no-aging-gap-v2',
      'stage',CASE WHEN slo.due_at<p_now
           THEN 'OVERDUE_INDEPENDENT_LEARNING_EVIDENCE'
           ELSE 'WAIT_ORIGINAL_PROVIDER_LEARNING_EVIDENCE' END,
      'source','social_learning_obligations',
      'original_obligation_id',slo.obligation_id,
      'original_tenant_id',slo.tenant_id,
      'original_post_id',slo.post_id,
      'original_source_type',slo.type,
      'original_source_status',slo.status,
      'next_owner',coalesce(nullif(slo.owner,''),'POWERHOUSE_SOCIAL_LEARNING'),
      'due_at',slo.due_at,
      'recheck_requested_at',p_now,
      'next_action','ORIGINAL_PROVIDER_METRICS_READBACK_AND_SOURCE_BOUND_LEARNING_RECONCILIATION',
      'forbid_unsupported_repost',true,
      'no_synthetic_experiment_winner',true,
      'no_claimed_provider_approval',true);
    INSERT INTO public.brain_obligations(
      obligation_type,capability_id,business_entity,business_period,
      business_timezone,payload_sha256,change_id,owner,state,evidence,
      created_at,updated_at,version)
    VALUES(
      'CONTENT_HANDOFF',
      'social-learning:'||substr(md5(slo.tenant_id||':'||slo.obligation_id),1,32),
      'original-provider-to-learning-chain','continuous','Europe/Amsterdam',
      md5('original-learning-handoff|'||slo.tenant_id||':'||slo.obligation_id),
      'original-content-handoff-no-aging-gap-v2',
      coalesce(nullif(slo.owner,''),'POWERHOUSE_SOCIAL_LEARNING'),
      'OPEN',v_payload,p_now,p_now,1)
    ON CONFLICT(obligation_type,capability_id,business_entity,
                business_period,business_timezone)
    DO UPDATE SET owner=excluded.owner,evidence=excluded.evidence,
                  updated_at=excluded.updated_at,
                  version=public.brain_obligations.version+1
    WHERE public.brain_obligations.owner IS DISTINCT FROM excluded.owner
       OR (public.brain_obligations.evidence-'recheck_requested_at')
           IS DISTINCT FROM (excluded.evidence-'recheck_requested_at')
       OR public.brain_obligations.updated_at<p_now-interval '6 hours';
  END LOOP;

  -- 2026-11-12: preserve a single original #171 owner. Some old
  -- 24h readback/measurement aliases are duplicate obligations for an
  -- already source-verified, evaluated canonical 24h window. Acknowledge
  -- only exact source/tenant/post/window/metric-event/evaluation identity;
  -- never fetch or synthesize a new historical metric or provider post.
  WITH qualified AS MATERIALIZED (
    SELECT o.tenant_id,o.obligation_id,o.type,o.post_id,o.window_hours,
           v.obligation_id verified_obligation_id,
           v.payload->'resolution' original_resolution,
           e.evaluation_id,s.source_event_id,s.observed_at,
           p.channel_kind
    FROM public.social_learning_obligations o
    JOIN public.social_posts p ON p.tenant_id=o.tenant_id
      AND p.post_id=o.post_id AND p.published_at IS NOT NULL
    JOIN public.social_learning_obligations v ON v.tenant_id=o.tenant_id
      AND v.obligation_id='social-snapshot:'||o.post_id||':24'
      AND v.window_hours=24 AND v.status='MEASUREMENT_VERIFIED'
      AND v.payload#>>'{resolution,contract}'='ORIGINAL_SOCIAL_WINDOW_EVIDENCE_ACK_V1'
      AND v.payload#>>'{resolution,post_id}'=o.post_id
      AND v.payload#>>'{resolution,source}'='buffer'
    JOIN public.social_learning_evaluations e ON e.tenant_id=o.tenant_id
      AND e.post_id=o.post_id AND e.window_hours=24
      AND e.evaluation_id=v.payload#>>'{resolution,evaluation_id}'
      AND jsonb_typeof(e.metric_vector->'impressions')='number'
    JOIN public.social_metric_snapshots s ON s.tenant_id=o.tenant_id
      AND s.post_id=o.post_id
      AND s.source_event_id=v.payload#>>'{resolution,source_event_id}'
      AND s.observed_at=e.observed_at
      AND s.data_quality='OBSERVED' AND s.source='buffer'
      AND jsonb_typeof(s.metrics->'impressions')='number'
      AND s.observed_at BETWEEN p.published_at+interval '18 hours'
                           AND p.published_at+interval '30 hours'
    JOIN public.brain_obligations b ON
      b.obligation_type='CONTENT_HANDOFF'
      AND b.capability_id='social-learning:'||substr(md5(o.tenant_id||':'||o.obligation_id),1,32)
      AND b.business_entity='original-provider-to-learning-chain'
      AND b.business_period='continuous'
      AND b.business_timezone='Europe/Amsterdam'
      AND b.change_id='original-content-handoff-no-aging-gap-v2'
      AND b.state='OPEN'
      AND b.evidence->>'original_obligation_id'=o.obligation_id
      AND b.evidence->>'original_tenant_id'=o.tenant_id
      AND b.evidence->>'original_post_id'=o.post_id
    LEFT JOIN public.powerhouse_channel_decisions d
      ON d.run_date=(p.published_at AT TIME ZONE 'Europe/Amsterdam')::date
      AND d.delivery_ref=o.post_id
      AND d.channel='linkedin_company' AND d.decision='publish'
    WHERE o.tenant_id='canonical' AND o.window_hours=24
      AND o.status IN ('OPEN','MEASUREMENT_VERIFIED')
      AND (
        (o.type='POST_MEASUREMENT'
          AND p.channel_kind='linkedin_personal'
          AND o.payload->>'channel'='linkedin_personal'
          AND o.payload->>'learning_fingerprint'='linkedin-personal-identity-hard-gate-v3')
        OR
        (o.type='post_dispatch_readback'
          AND p.channel_kind='linkedin_company'
          AND o.payload->>'channel'='linkedin_company'
          AND o.payload->>'learning_fingerprint'='linkedin-content-ready-dispatch-watchdog-v1'
          AND d.state='published' AND d.delivery_ref=p.post_id
          AND nullif(d.delivery_evidence->>'provider_readback','') IS NOT NULL)
      )
    ORDER BY o.due_at,o.tenant_id,o.obligation_id LIMIT 24
  ), source_acks AS (
    UPDATE public.social_learning_obligations o
      SET status='MEASUREMENT_VERIFIED',
          payload=coalesce(o.payload,'{}'::jsonb)||
            jsonb_build_object('resolution',q.original_resolution||
              jsonb_build_object(
                'contract','ORIGINAL_SOCIAL_WINDOW_LEGACY_ALIAS_ACK_V1',
                'original_canonical_contract','ORIGINAL_SOCIAL_WINDOW_EVIDENCE_ACK_V1',
                'original_verified_obligation_id',q.verified_obligation_id,
                'evaluation_id',q.evaluation_id,'source_event_id',q.source_event_id,
                'source_post_id',q.post_id,'tenant_id',q.tenant_id,
                'historical_reconciliation_at',p_now,'alias_type',q.type,
                'no_new_measurement',true,'no_new_provider_write',true,
                'measurement_only',true,'no_causal_effect_or_revenue_inferred',true)),
          updated_at=p_now
    FROM qualified q
    WHERE o.tenant_id=q.tenant_id AND o.obligation_id=q.obligation_id
      AND o.status='OPEN'
    RETURNING o.tenant_id,o.obligation_id,o.post_id,o.payload->'resolution' resolution
  ), acknowledged AS (
    SELECT a.tenant_id,a.obligation_id,a.post_id,a.resolution
    FROM source_acks a
    UNION ALL
    SELECT q.tenant_id,q.obligation_id,q.post_id,o.payload->'resolution'
    FROM qualified q
    JOIN public.social_learning_obligations o
      ON o.tenant_id=q.tenant_id AND o.obligation_id=q.obligation_id
    WHERE o.status='MEASUREMENT_VERIFIED'
      AND o.payload#>>'{resolution,contract}'='ORIGINAL_SOCIAL_WINDOW_LEGACY_ALIAS_ACK_V1'
      AND o.payload#>>'{resolution,original_verified_obligation_id}'=q.verified_obligation_id
      AND o.payload#>>'{resolution,source_event_id}'=q.source_event_id
  ), consumer_acks AS (
    UPDATE public.brain_obligations b
      SET state='FULFILLED',
          evidence=coalesce(b.evidence,'{}'::jsonb)||jsonb_build_object(
            'stage','MEASUREMENT_WINDOW_ACK_VERIFIED',
            'original_source_status','MEASUREMENT_VERIFIED',
            'resolved_by','original-canonical-24h-source-observation-and-evaluation',
            'original_resolution',a.resolution,
            'consumer_ack_at',p_now,
            'measurement_only',true,'causal_lift_proven',false,
            'downstream_next_post_application_proven',false,
            'no_new_publication_or_provider_write',true),
          updated_at=p_now,version=b.version+1
    FROM acknowledged a
    WHERE b.obligation_type='CONTENT_HANDOFF'
      AND b.capability_id='social-learning:'||substr(md5(a.tenant_id||':'||a.obligation_id),1,32)
      AND b.business_entity='original-provider-to-learning-chain'
      AND b.business_period='continuous'
      AND b.business_timezone='Europe/Amsterdam'
      AND b.change_id='original-content-handoff-no-aging-gap-v2'
      AND b.evidence->>'original_obligation_id'=a.obligation_id
      AND b.evidence->>'original_tenant_id'=a.tenant_id
      AND b.evidence->>'original_post_id'=a.post_id
      AND b.state='OPEN'
    RETURNING b.id
  )
  SELECT (SELECT count(*) FROM source_acks),
         (SELECT count(*) FROM consumer_acks)
    INTO v_legacy_source_acks,v_legacy_consumer_acks;

  -- Original source has a *real*, explicitly cancelled learning obligation:
  -- user deleted an invalid-identity post. It is excluded from the OPEN-only
  -- replay by design; acknowledge that negative source state exactly once so
  -- no original source event disappears from ONE BRAIN. Never synthesize a
  -- provider post, metric snapshot, causal evaluation or republish action.
  WITH original_cancelled AS MATERIALIZED (
    SELECT x.tenant_id,x.obligation_id,x.post_id,x.owner,x.updated_at,x.payload
    FROM public.social_learning_obligations x
    LEFT JOIN public.brain_obligations b
      ON b.obligation_type='CONTENT_HANDOFF'
     AND b.capability_id='social-learning:'||substr(md5(x.tenant_id||':'||x.obligation_id),1,32)
     AND b.business_entity='original-provider-to-learning-chain'
     AND b.business_period='continuous'
     AND b.business_timezone='Europe/Amsterdam'
    WHERE x.tenant_id='canonical'
      AND x.status='CANCELLED'
      AND x.payload->>'cancel_reason'='user_deleted_invalid_identity_post'
      AND x.payload->>'invalid_for_performance_learning'='true'
      AND x.updated_at IS NOT NULL
      AND nullif(x.obligation_id,'') IS NOT NULL
      AND (b.id IS NULL OR (
        b.state IN ('OPEN','CANCELLED')
        AND (b.evidence->>'stage' IS DISTINCT FROM 'SOURCE_CANCELLED_INVALID_LEARNING_ACK'
          OR b.evidence->>'source_revision' IS DISTINCT FROM
             to_char(x.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
          OR b.evidence#>>'{consumer_ack,source_revision}' IS DISTINCT FROM
             to_char(x.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
          OR b.evidence#>>'{consumer_ack,accepted}' IS DISTINCT FROM 'true')))
    ORDER BY x.updated_at,x.tenant_id,x.obligation_id
    LIMIT 12
  )
  INSERT INTO public.brain_obligations(
    obligation_type,capability_id,business_entity,business_period,business_timezone,
    payload_sha256,change_id,owner,state,evidence,created_at,updated_at,version)
  SELECT 'CONTENT_HANDOFF',
    'social-learning:'||substr(md5(x.tenant_id||':'||x.obligation_id),1,32),
    'original-provider-to-learning-chain','continuous','Europe/Amsterdam',
    md5('original-learning-handoff|'||x.tenant_id||':'||x.obligation_id),
    'original-content-handoff-no-aging-gap-v2',
    coalesce(nullif(x.owner,''),'POWERHOUSE_SOCIAL_LEARNING'),
    'CANCELLED',jsonb_build_object(
       'contract','original-content-handoff-no-aging-gap-v2',
       'stage','SOURCE_CANCELLED_INVALID_LEARNING_ACK',
       'source','social_learning_obligations',
       'original_obligation_id',x.obligation_id,
       'original_tenant_id',x.tenant_id,
       'original_post_id',x.post_id,
       'original_source_status','CANCELLED',
       'source_cancel_reason',x.payload->>'cancel_reason',
       'source_invalid_for_performance_learning',true,
       'source_revision',to_char(x.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
       'source_correlation_id',md5('original-learning-handoff|'||x.tenant_id||':'||x.obligation_id),
       'consumer_ack',jsonb_build_object(
         'accepted',true,'acceptance_scope','ORIGINAL_SOURCE_CANCELLATION_ONLY_NOT_PROVIDER_OR_LEARNING',
         'source_revision',to_char(x.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
         'source_correlation_id',md5('original-learning-handoff|'||x.tenant_id||':'||x.obligation_id),
         'original_source_status','CANCELLED',
         'provider_proven',false,'measurement_proven',false,'learning_proven',false),
       'next_owner',coalesce(nullif(x.owner,''),'POWERHOUSE_SOCIAL_LEARNING'),
       'next_action','DO_NOT_REPOST_CANCELLED_INVALID_IDENTITY_SOURCE',
       'publication_proven',false,'measurement_proven',false,'causal_lift_proven',false,
       'no_new_publication_or_provider_write',true,
       'no_synthetic_experiment_winner',true,
       'no_provider_readback_claimed',true),
    p_now,p_now,1
  FROM original_cancelled x
  WHERE true -- disambiguate original INSERT...SELECT from the UPSERT conflict clause
  ON CONFLICT(obligation_type,capability_id,business_entity,business_period,business_timezone)
  DO UPDATE SET owner=excluded.owner,state=excluded.state,evidence=excluded.evidence,
      updated_at=excluded.updated_at,version=public.brain_obligations.version+1
  WHERE public.brain_obligations.state IN ('OPEN','CANCELLED')
    AND (public.brain_obligations.state IS DISTINCT FROM excluded.state
      OR public.brain_obligations.owner IS DISTINCT FROM excluded.owner
      OR public.brain_obligations.evidence IS DISTINCT FROM excluded.evidence);
  GET DIAGNOSTICS v_cancelled_learning_source_acks = ROW_COUNT;

  SELECT count(*) INTO v_unregistered_old
  FROM public.content_publication_obligations c
  LEFT JOIN public.brain_obligations b
    ON b.obligation_type='CONTENT_HANDOFF'
   AND b.capability_id='content:'||c.channel
   AND b.business_entity='original-provider-to-learning-chain'
   AND b.business_period=c.publication_date::text
   AND b.business_timezone='Europe/Amsterdam'
  WHERE c.tenant_id='canonical'
    AND c.publication_date<v_day-8
    AND c.channel IN ('blog','instagram','linkedin_company','linkedin_personal')
    AND b.id IS NULL;

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
     'historical_unregistered_publications',v_unregistered_old,
     'learning_detail_reinspected',v_learning_scanned,
    'legacy_source_acks',v_legacy_source_acks,
    'legacy_brain_consumer_acks',v_legacy_consumer_acks,
    'cancelled_learning_source_acks',v_cancelled_learning_source_acks,
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
    'historical_unregistered_publications',v_unregistered_old,
    'learning_detail_reinspected',v_learning_scanned,
    'legacy_source_acks',v_legacy_source_acks,
    'legacy_brain_consumer_acks',v_legacy_consumer_acks,
    'cancelled_learning_source_acks',v_cancelled_learning_source_acks,
    'single_original_executor',true);
END;
$function$
;
REVOKE ALL ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)
 TO service_role;
