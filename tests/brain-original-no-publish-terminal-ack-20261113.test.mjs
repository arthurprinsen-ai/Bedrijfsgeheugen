import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261113062500_original_no_publish_terminal_handoff_ack_v1.sql',import.meta.url),'utf8');

const validVeto=record=>record.status==='SKIPPED'
  &&record.evidence?.decision==='NO_PUBLISH'
  &&record.evidence?.veto?.active===true
  &&['decision_code','decided_at','no_publish_reason'].every(k=>String(record.evidence[k]??'').trim())
  &&!record.external_id&&!record.published_at&&!record.live_proven_at
  &&record.evidence?.provider_truth_verified!==true
  &&record.evidence?.reconciliation_required!==true
  &&record.evidence?.possible_provider_side_effect!==true
  &&!record.evidence?.source_state_conflict;
const record={
 status:'SKIPPED',external_id:null,published_at:null,live_proven_at:null,
 evidence:{decision:'NO_PUBLISH',veto:{active:true,reason:'STALE_BACKLOG_CLEAN_SLATE_20261108'},
  decision_code:'STALE_BACKLOG_CLEAN_SLATE_20261108',
  decided_at:'2026-11-08T13:52:35.559797+00:00',
  no_publish_reason:'Historical expired date; do not republish'}
};

test('source original explicit no-publish is distinct from publication and terminalized only as cancellation',()=>{
 assert.equal(validVeto(record),true);
 for(const clause of [
  "r.status='SKIPPED'", "r.evidence->>'decision'='NO_PUBLISH'",
  "r.evidence#>>'{veto,active}'='true'",
  "r.evidence->>'decision_code'", "r.evidence->>'decided_at'",
  "r.evidence->>'no_publish_reason'",
  "r.external_id IS NULL AND r.published_at IS NULL AND r.live_proven_at IS NULL",
  "coalesce(r.evidence->>'provider_truth_verified','false')<>'true'",
  "coalesce(r.evidence->>'possible_provider_side_effect','false')<>'true'",
  "coalesce(r.evidence->>'reconciliation_required','false')<>'true'",
  "nullif(r.evidence->>'source_state_conflict','') IS NULL",
  "v_stage:='NO_PUBLISH_POLICY_ACK'",
  "CASE WHEN v_no_publish THEN 'CANCELLED'",
  "IF NOT v_reuse AND NOT v_no_publish THEN v_open:=v_open+1",
  "'publication_proven',false,'provider_send_allowed',false",
  "'measurement_or_learning_claimed',false",
  "'NO_PUBLISH_VETO_ACK_TERMINAL_NO_PROVIDER_SEND'"
 ]) assert.ok(sql.includes(clause),'source contract missing '+clause);
 assert.doesNotMatch(sql,/CASE WHEN v_no_publish THEN 'FULFILLED'/);
});

test('no-publish never authorizes a retry where original provider side effect or source conflict exists',()=>{
 const negative=[
  {...record,external_id:'urn:li:share:123456'},
  {...record,published_at:'2026-11-02T12:00:00Z'},
  {...record,live_proven_at:'2026-11-02T12:00:00Z'},
  {...record,evidence:{...record.evidence,veto:{active:false}}},
  {...record,evidence:{...record.evidence,decision:'PUBLISH'}},
  {...record,evidence:{...record.evidence,decision_code:''}},
  {...record,evidence:{...record.evidence,decided_at:null}},
  {...record,evidence:{...record.evidence,no_publish_reason:''}},
  {...record,evidence:{...record.evidence,provider_truth_verified:true}},
  {...record,evidence:{...record.evidence,reconciliation_required:true}},
  {...record,evidence:{...record.evidence,possible_provider_side_effect:true}},
  {...record,evidence:{...record.evidence,source_state_conflict:'SKIPPED_WITH_ORIGINAL_PROVIDER_REFERENCE'}},
 ];
 for(const value of negative)assert.equal(validVeto(value),false,JSON.stringify(value));
 const contradiction=sql.indexOf("v_stage:='OVERDUE_PROVIDER_READBACK'");
 const noPublish=sql.indexOf("v_stage:='NO_PUBLISH_POLICY_ACK'");
 assert.ok(contradiction>0&&noPublish>contradiction,'original provider-reference reconciliation has strict priority');
 assert.match(sql,/v_stage:='OVERDUE_PROVIDER_READBACK'/);
 assert.match(sql,/v_owner:='powerhouse-social-publisher \/ original provider account'/);
});

test('a terminal veto is not replayed forever, but source revocation must reopen original historical care',()=>{
 for(const clause of [
  "b.state IS DISTINCT FROM 'CANCELLED'",
  "b.evidence->>'stage' IS DISTINCT FROM 'NO_PUBLISH_POLICY_ACK'",
  "OR NOT coalesce((",
  "c.status='SKIPPED'",
  "c.external_id IS NULL AND c.published_at IS NULL AND c.live_proven_at IS NULL",
  "v_metric:=false;v_analysis:=false;v_reuse:=false;v_no_publish:=false"
 ])assert.ok(sql.includes(clause),'historical safety or reset missing: '+clause);
 assert.match(sql,/OR NOT coalesce\(\([\s\S]*?c\.evidence#>>'\{veto,active\}'='true'/);
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1/g)||[]).length,1);
});

test('the original #171 service_role-only handoff and independent metric/learning boundaries stay intact',()=>{
 for(const clause of [
  "SECURITY DEFINER", "SET search_path TO 'pg_catalog', 'public'",
  "REVOKE ALL ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)",
  "FROM PUBLIC,anon,authenticated",
  "GRANT EXECUTE ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)",
  "TO service_role;",
  "'original-content-handoff-receipts-v1'",
  "v_metric_observed_at",
  "ORIGINAL_SOURCE_EVENT_AND_OBSERVED_AT_SAME_ROW_V1",
  "ORIGINAL_SOCIAL_WINDOW_LEGACY_ALIAS_ACK_V1",
  "social_learning_obligations",
  "'provider_reference_reconciliation'"
 ])assert.ok(sql.includes(clause),'existing authority boundary missing '+clause);
 assert.doesNotMatch(sql,/net\.http_post|GMAIL_SEND_EMAIL|cron\.schedule|create trigger/i);
});
