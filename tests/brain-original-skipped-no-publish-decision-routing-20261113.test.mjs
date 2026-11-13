import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const previous=readFileSync(new URL('../supabase/migrations/20261113121500_original_ga4_handoff_json_operator_precedence_v1.sql',import.meta.url),'utf8');
const current=readFileSync(new URL('../supabase/migrations/20261113132000_original_skipped_no_publish_evidence_routing_v1.sql',import.meta.url),'utf8');
const scope=(sql)=>sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.powerhouse_content_handoff_receipts_v1('));
const oldRoute=`    ELSIF NOT v_pub THEN
      v_stage:=CASE WHEN p_now>v_pub_due THEN 'OVERDUE_PUBLICATION' ELSE 'WAIT_PUBLICATION' END;
      v_owner:=CASE r.channel
       WHEN 'blog' THEN 'powerhouse-blog-queue / original protected blog writer'
       WHEN 'instagram' THEN 'powerhouse-mira-problem-radar / original media router'
       ELSE 'powerhouse-content-orchestrator / original social publisher' END;
      v_due:=v_pub_due;`;
const newRoute=`    -- A SKIPPED source is not an authorization to publish. Missing original
    -- veto/decision metadata is an unresolved governance/source proof, while
    -- any possible provider side effect needs exact owner/account readback.
    -- NEVER fall through to the original publication sender/queue.
    ELSIF NOT v_pub AND r.status='SKIPPED' THEN
      IF nullif(btrim(coalesce(r.external_id,'')),'') IS NOT NULL
         OR r.published_at IS NOT NULL OR r.live_proven_at IS NOT NULL
         OR r.evidence->>'possible_provider_side_effect'='true'
         OR r.evidence->>'reconciliation_required'='true'
         OR nullif(btrim(coalesce(r.evidence->>'source_state_conflict','')),'') IS NOT NULL THEN
        v_stage:='OVERDUE_PROVIDER_READBACK';
        v_owner:=CASE WHEN r.channel='blog'
          THEN 'powerhouse-blog-queue / original protected blog writer'
          ELSE 'powerhouse-social-publisher / original provider account' END;
      ELSE
        v_stage:='OVERDUE_NO_PUBLISH_SOURCE_DECISION_PROOF';
        v_owner:='powerhouse-content-loop / original no-publish governance';
      END IF;
      v_due:=v_pub_due;
    ELSIF NOT v_pub THEN
      v_stage:=CASE WHEN p_now>v_pub_due THEN 'OVERDUE_PUBLICATION' ELSE 'WAIT_PUBLICATION' END;
      v_owner:=CASE r.channel
       WHEN 'blog' THEN 'powerhouse-blog-queue / original protected blog writer'
       WHEN 'instagram' THEN 'powerhouse-mira-problem-radar / original media router'
       ELSE 'powerhouse-content-orchestrator / original social publisher' END;
      v_due:=v_pub_due;`;
const oldAction=`       WHEN v_stage='NO_PUBLISH_POLICY_ACK'
         THEN 'NO_PUBLISH_VETO_ACK_TERMINAL_NO_PROVIDER_SEND'
       WHEN v_stage='OVERDUE_PROVIDER_READBACK'`;
const newAction=`       WHEN v_stage='NO_PUBLISH_POLICY_ACK'
         THEN 'NO_PUBLISH_VETO_ACK_TERMINAL_NO_PROVIDER_SEND'
       WHEN v_stage='OVERDUE_NO_PUBLISH_SOURCE_DECISION_PROOF'
         THEN 'ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND'
       WHEN v_stage='OVERDUE_PROVIDER_READBACK'`;

test('original #171 function is changed at exactly the two narrow source-routing locations',()=>{
  assert.equal(scope(previous).split(oldRoute).length,2);
  assert.equal(scope(previous).split(oldAction).length,2);
  assert.equal(scope(current),scope(previous).replace(oldRoute,newRoute).replace(oldAction,newAction),
    'no owner, scope, terminal state, producer, metric, authorizations or side effects may change');
});

test('explicit already verified no-publish veto keeps strict precedence and terminal contract',()=>{
 const script=scope(current);
 const contradiction=script.indexOf("v_stage:='OVERDUE_PROVIDER_READBACK'");
 const approved=script.indexOf("v_stage:='NO_PUBLISH_POLICY_ACK'");
 const missing=script.indexOf("ELSIF NOT v_pub AND r.status='SKIPPED' THEN");
 const publisher=script.indexOf("ELSIF NOT v_pub THEN",missing+5);
 assert.ok(contradiction>0&&approved>contradiction&&missing>approved&&publisher>missing,
    'provider conflict first, exact qualified veto second, ambiguous skipped third, never back to publisher');
 for(const check of [
  "r.evidence->>'decision'='NO_PUBLISH'",
  "r.evidence#>>'{veto,active}'='true'",
  "r.evidence->>'decision_code'",
  "r.evidence->>'decided_at'",
  "r.evidence->>'no_publish_reason'",
  "r.external_id IS NULL AND r.published_at IS NULL AND r.live_proven_at IS NULL",
  "coalesce(r.evidence->>'possible_provider_side_effect','false')<>'true'",
  "CASE WHEN v_no_publish THEN 'CANCELLED'",
  "WHEN v_no_publish THEN 'CANCELLED'",
  "'publication_proven',false,'provider_send_allowed',false"
 ])assert.ok(script.includes(check),check);
 assert.match(script,/CASE WHEN v_no_publish THEN 'CANCELLED'/);
 assert.doesNotMatch(script,/CASE WHEN v_no_publish THEN 'FULFILLED'/);
});

test('skipped sources with ambiguous provider side effect require original independent account readback',()=>{
 const script=scope(current);
 for(const token of [
  "r.external_id,''",
  "r.published_at IS NOT NULL OR r.live_proven_at IS NOT NULL",
  "r.evidence->>'possible_provider_side_effect'='true'",
  "r.evidence->>'reconciliation_required'='true'",
  "r.evidence->>'source_state_conflict'",
  "v_stage:='OVERDUE_PROVIDER_READBACK'",
  "v_owner:=CASE WHEN r.channel='blog'",
  "'powerhouse-blog-queue / original protected blog writer'",
  "'powerhouse-social-publisher / original provider account'"
 ])assert.ok(script.includes(token),token);
 assert.match(script,/'republish_forbidden'/);
 assert.match(script,/'publication_side_effect_must_not_repeat',true/);
});

test('historical skipped with missing decision_code must remain OPEN and owned by original veto governance, never sent',()=>{
 const s=scope(current);
 assert.match(s,/ELSIF NOT v_pub AND r.status='SKIPPED' THEN/);
 assert.match(s,/v_stage:='OVERDUE_NO_PUBLISH_SOURCE_DECISION_PROOF'/);
 assert.match(s,/v_owner:='powerhouse-content-loop \/ original no-publish governance'/);
 assert.match(s,/'ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND'/);
 assert.match(s,/WHEN v_stage='OVERDUE_NO_PUBLISH_SOURCE_DECISION_PROOF'/);
 assert.match(s,/WHEN v_stage='NO_PUBLISH_POLICY_ACK'/);
 assert.match(s,/WHEN v_stage='OVERDUE_PROVIDER_READBACK'/);
 // The original publication queue receives only genuine NOT SKIPPED / NOT live rows.
 const regular=s.slice(s.indexOf("ELSIF NOT v_pub THEN",s.indexOf("ELSIF NOT v_pub AND r.status='SKIPPED' THEN")));
 assert.ok(regular.includes("v_stage:=CASE WHEN p_now>v_pub_due THEN 'OVERDUE_PUBLICATION'"));
 assert.match(s,/\x27original-provider-to-learning-chain\x27/);
});

test('single scheduler, original authorization and true provider outcome gates remain fail-closed',()=>{
 for(const x of [
  'REVOKE ALL ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)',
  'FROM PUBLIC,anon,authenticated;',
  'TO service_role;',
  "v_event:='ga4:'||(r.metrics->>'window_start')||':'||(r.metrics->>'window_end');",
  "r.metrics->>'data_quality' NOT IN('UNVERIFIED','INSUFFICIENT_DATA')",
  "'ORIGINAL_SOURCE_STATE_ONLY_NOT_PROVIDER_OUTCOME'",
  "v_metric:=false;v_analysis:=false;v_reuse:=false;v_no_publish:=false",
  'public.brain_obligations',
  'public.social_learning_obligations'
 ])assert.ok(current.includes(x),'lost original proof gate: '+x);
 assert.doesNotMatch(current,/\bCREATE\s+(?:OR\s+REPLACE\s+)?(?:TRIGGER|EXTENSION)\b|cron\.schedule|net\.http_post|INSTAGRAM_CREATE_MEDIA|LINKEDIN_CREATE_LINKED_IN_POST/i);
 const terminal=readFileSync(new URL('../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',import.meta.url),'utf8');
 for(const marker of ['CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED','CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED','CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED'])assert.ok(terminal.includes(marker));
});
