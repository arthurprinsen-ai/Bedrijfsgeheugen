-- P0 #4198, 2026-11-13.
-- Defensive terminal-state invariant on the ORIGINAL ONE BRAIN content handoff.
-- It creates NO new scheduler, sender, outbox, owner, queue or alternative truth store.
-- Historical rows are not rewritten; only INSERT/UPDATE of applicable terminal rows
-- are checked. Native protected GitHub -> Supabase migration delivery required.

CREATE OR REPLACE FUNCTION public.brain_guard_content_terminal_proof_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $handoff_guard$
DECLARE
  v_source public.content_publication_obligations%ROWTYPE;
  v_channel text;
  v_expected_revision text;
  v_expected_key text;
  v_expected_correlation text;
BEGIN
  IF NEW.obligation_type IS DISTINCT FROM 'CONTENT_HANDOFF'
    OR NEW.business_entity IS DISTINCT FROM 'original-provider-to-learning-chain'
    OR NEW.capability_id NOT LIKE 'content:%'
    OR NEW.capability_id='content:email_newsletter'
    OR NEW.state NOT IN ('FULFILLED','CANCELLED') THEN
    RETURN NEW;
  END IF;

  -- Source cannot be derived from a status flag: read the ORIGINAL tenant source.
  v_channel := substring(NEW.capability_id FROM 9);
  IF v_channel NOT IN ('blog','instagram','linkedin_company','linkedin_personal')
     OR NEW.business_timezone IS DISTINCT FROM 'Europe/Amsterdam' THEN
    RAISE EXCEPTION 'CONTENT_HANDOFF_TERMINAL_SOURCE_SCOPE_INVALID'
      USING ERRCODE='23514';
  END IF;
  SELECT c.* INTO v_source
    FROM public.content_publication_obligations c
   WHERE c.tenant_id = NEW.evidence->>'tenant_id'
     AND c.channel = v_channel
     AND c.publication_date::text = NEW.business_period;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CONTENT_HANDOFF_TERMINAL_ORIGINAL_SOURCE_MISSING'
      USING ERRCODE='23514';
  END IF;

  v_expected_revision := to_char(v_source.updated_at AT TIME ZONE 'UTC',
                                  'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
  v_expected_key := v_source.tenant_id||'|'||v_channel||'|'||NEW.business_period;
  v_expected_correlation := md5(
    'original-content-handoff|'||v_channel||'|'||NEW.business_period);

  -- Idempotency, owner and exact source-version consumption are independent.
  IF coalesce(NEW.evidence->>'tenant_id','') <> v_source.tenant_id
    OR coalesce(NEW.evidence->>'source_record_key','') <> v_expected_key
    OR coalesce(NEW.evidence->>'source_revision','') <> v_expected_revision
    OR coalesce(NEW.evidence->>'source_correlation_id','') <> v_expected_correlation
    OR coalesce(NEW.payload_sha256,'') <> v_expected_correlation
    OR coalesce(NEW.evidence#>>'{consumer_ack,accepted}','false') <> 'true'
    OR coalesce(NEW.evidence#>>'{consumer_ack,acceptance_scope}','')
       <> 'ORIGINAL_SOURCE_STATE_ONLY_NOT_PROVIDER_OUTCOME'
    OR coalesce(NEW.evidence#>>'{consumer_ack,source_revision}','') <> v_expected_revision
    OR coalesce(NEW.evidence#>>'{consumer_ack,source_correlation_id}','') <> v_expected_correlation
    OR coalesce(NEW.evidence#>>'{consumer_ack,owner}','') <> coalesce(NEW.owner,'')
    OR coalesce(NEW.evidence#>>'{consumer_ack,stage}','') <> coalesce(NEW.evidence->>'stage','')
    OR coalesce(NEW.evidence#>>'{consumer_ack,source_status}','') <> v_source.status
  THEN
    RAISE EXCEPTION 'CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED'
      USING ERRCODE='23514';
  END IF;

  IF NEW.state='CANCELLED' THEN
    -- An explicit original veto with NO provider side effect is the only
    -- terminal cancellation. A skipped-but-sent provider post stays OPEN.
    IF coalesce(NEW.evidence->>'stage','') <> 'NO_PUBLISH_POLICY_ACK'
      OR coalesce(NEW.evidence#>>'{consumer_ack,no_publish_veto_accepted}','false') <> 'true'
      OR coalesce(NEW.evidence#>>'{no_publish_consumer,accepted}','false') <> 'true'
      OR v_source.status <> 'SKIPPED'
      OR coalesce(v_source.evidence->>'decision','') <> 'NO_PUBLISH'
      OR coalesce(v_source.evidence#>>'{veto,active}','false') <> 'true'
      OR nullif(v_source.evidence->>'decision_code','') IS NULL
      OR nullif(v_source.evidence->>'decided_at','') IS NULL
      OR nullif(v_source.evidence->>'no_publish_reason','') IS NULL
      OR v_source.external_id IS NOT NULL
      OR v_source.published_at IS NOT NULL
      OR v_source.live_proven_at IS NOT NULL
      OR coalesce(v_source.evidence->>'provider_truth_verified','false')='true'
      OR coalesce(v_source.evidence->>'possible_provider_side_effect','false')='true'
      OR coalesce(v_source.evidence->>'reconciliation_required','false')='true'
      OR coalesce(v_source.evidence->>'source_state_conflict','') <> ''
    THEN
      RAISE EXCEPTION 'CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED'
        USING ERRCODE='23514';
    END IF;
  ELSE
    -- Source acceptance alone never creates FULFILLED. Actual first-party
    -- publication, independently observed metric, Brain evaluation and
    -- proved subsequent application must ALL be present.
    IF coalesce(NEW.evidence->>'stage','') <> 'PROVEN_NEXT_EXPERIMENT_HANDOFF'
      OR coalesce(NEW.evidence#>>'{consumer_ack,provider_proven}','false') <> 'true'
      OR coalesce(NEW.evidence#>>'{consumer_ack,measurement_proven}','false') <> 'true'
      OR coalesce(NEW.evidence#>>'{consumer_ack,experiment_proven}','false') <> 'true'
      OR coalesce(NEW.evidence#>>'{producer,verified}','false') <> 'true'
      OR coalesce(NEW.evidence#>>'{measurement_consumer,accepted}','false') <> 'true'
      OR nullif(NEW.evidence#>>'{measurement_consumer,source_event_id}','') IS NULL
      OR coalesce(NEW.evidence#>>'{analysis_consumer,accepted}','false') <> 'true'
      OR nullif(NEW.evidence#>>'{analysis_consumer,evaluation_id}','') IS NULL
      OR coalesce(NEW.evidence#>>'{experiment_consumer,accepted}','false') <> 'true'
      OR nullif(NEW.evidence#>>'{experiment_consumer,next_provider_id}','') IS NULL
      OR v_source.live_proven_at IS NULL
      OR v_source.learned_at IS NULL
      OR coalesce(v_source.evidence->>'learning_applied_verified','false') <> 'true'
    THEN
      RAISE EXCEPTION 'CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED'
        USING ERRCODE='23514';
    END IF;
    IF v_channel='blog' THEN
      IF coalesce(v_source.evidence->>'public_http_status','') <> '200'
        OR nullif(v_source.evidence->>'netlify_deploy_id','') IS NULL
        OR v_source.canonical_url NOT LIKE 'https://www.bedrijfsgeheugen.nl/blog/%'
      THEN
        RAISE EXCEPTION 'CONTENT_HANDOFF_BLOG_ORIGINAL_PROVIDER_PROOF_REQUIRED'
          USING ERRCODE='23514';
      END IF;
    ELSE
      IF nullif(v_source.external_id,'') IS NULL
        OR coalesce(v_source.evidence->>'provider_truth_verified','false') <> 'true'
        OR coalesce(NEW.evidence#>>'{producer,provider_id}','') <> v_source.external_id
        OR v_source.canonical_url NOT LIKE 'https://%'
      THEN
        RAISE EXCEPTION 'CONTENT_HANDOFF_SOCIAL_ORIGINAL_PROVIDER_PROOF_REQUIRED'
          USING ERRCODE='23514';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$handoff_guard$;

REVOKE ALL ON FUNCTION public.brain_guard_content_terminal_proof_v1() FROM PUBLIC, anon, authenticated;
-- Trigger fires using the existing authorized writer's invoker privileges.
-- A client cannot call a trigger function as an RPC.
DROP TRIGGER IF EXISTS brain_content_handoff_terminal_proof_guard_v1
  ON public.brain_obligations;
CREATE TRIGGER brain_content_handoff_terminal_proof_guard_v1
BEFORE INSERT OR UPDATE ON public.brain_obligations
FOR EACH ROW EXECUTE FUNCTION public.brain_guard_content_terminal_proof_v1();
