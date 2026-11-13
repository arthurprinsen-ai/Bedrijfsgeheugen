import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261113082500_original_cancelled_social_learning_source_ack_v1.sql',import.meta.url),'utf8');

test('only original authoritatively cancelled invalid identity post enters source-only terminal BRAIN receipt',()=>{
 for(const gate of [
  "FROM public.social_learning_obligations x",
  "x.tenant_id='canonical'",
  "x.status='CANCELLED'",
  "x.payload->>'cancel_reason'='user_deleted_invalid_identity_post'",
  "x.payload->>'invalid_for_performance_learning'='true'",
  "x.updated_at IS NOT NULL",
  "nullif(x.obligation_id,'') IS NOT NULL",
  "b.id IS NULL OR (",
  "b.state IN ('OPEN','CANCELLED')",
  "LIMIT 12",
  "'stage','SOURCE_CANCELLED_INVALID_LEARNING_ACK'",
  "'original_source_status','CANCELLED'",
  "'source_cancel_reason',x.payload->>'cancel_reason'",
  "'source_invalid_for_performance_learning',true",
  "'next_action','DO_NOT_REPOST_CANCELLED_INVALID_IDENTITY_SOURCE'",
  "'no_new_publication_or_provider_write',true",
  "'no_provider_readback_claimed',true",
  "'no_synthetic_experiment_winner',true",
 ]) assert.ok(sql.includes(gate),'required original cancel source gate: '+gate);
 assert.doesNotMatch(sql,/FROM original_cancelled x\s+ON CONFLICT[\s\S]*?state='FULFILLED'/);
});

test('original tenant, identity, source revision and same idempotent BRAIN consumer ACK are inseparable',()=>{
 for(const contract of [
  "'social-learning:'||substr(md5(x.tenant_id||':'||x.obligation_id),1,32)",
  "md5('original-learning-handoff|'||x.tenant_id||':'||x.obligation_id)",
  "'original-content-handoff-no-aging-gap-v2'",
  "'original_obligation_id',x.obligation_id",
  "'original_tenant_id',x.tenant_id",
  "'source_revision',to_char(x.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')",
  "'source_correlation_id',md5('original-learning-handoff|'||x.tenant_id||':'||x.obligation_id)",
  "'consumer_ack',jsonb_build_object(",
  "'accepted',true,'acceptance_scope','ORIGINAL_SOURCE_CANCELLATION_ONLY_NOT_PROVIDER_OR_LEARNING'",
  "'original_source_status','CANCELLED'",
 ]) assert.ok(sql.includes(contract),'missing original source-specific ACK: '+contract);
 assert.ok(sql.split("md5('original-learning-handoff|'||x.tenant_id||':'||x.obligation_id)").length>=4);
 assert.ok(sql.split("to_char(x.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')").length>=4);
});

test('one-time fail-closed cancel evidence no duplicate mutation or completed-provider regression',()=>{
 for(const phrase of [
  "b.evidence->>'stage' IS DISTINCT FROM 'SOURCE_CANCELLED_INVALID_LEARNING_ACK'",
  "b.evidence->>'source_revision' IS DISTINCT FROM",
  "b.evidence#>>'{consumer_ack,source_revision}' IS DISTINCT FROM",
  "b.evidence#>>'{consumer_ack,accepted}' IS DISTINCT FROM 'true'",
  "WHERE public.brain_obligations.state IN ('OPEN','CANCELLED')",
  "OR public.brain_obligations.evidence IS DISTINCT FROM excluded.evidence",
  "GET DIAGNOSTICS v_cancelled_learning_source_acks = ROW_COUNT",
  "'cancelled_learning_source_acks',v_cancelled_learning_source_acks",
 ]) assert.ok(sql.includes(phrase),'missing original replay fence: '+phrase);
 assert.ok(sql.includes("AND coalesce(b.state,'OPEN')<>'FULFILLED'"));
 assert.ok(sql.includes("WHERE x.status='OPEN'"));
 assert.ok(sql.includes("WHERE o.tenant_id='canonical' AND o.window_hours=24"));
});

test('no provider sends, fabricated metric learning, increased roles, or second scheduler',()=>{
 for(const phrase of [
  "'provider_proven',false,'measurement_proven',false,'learning_proven',false",
  "'publication_proven',false,'measurement_proven',false,'causal_lift_proven',false",
  "SECURITY DEFINER",
  "SET search_path TO 'pg_catalog', 'public'",
  "REVOKE ALL ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)",
  "FROM PUBLIC,anon,authenticated",
  "GRANT EXECUTE ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)",
  "TO service_role;",
  "v_stage:='OVERDUE_PROVIDER_READBACK'",
  "v_stage:='NO_PUBLISH_POLICY_ACK'",
 ]) assert.ok(sql.includes(phrase),'unchanged safe original contract '+phrase);
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1/g)||[]).length,1);
 assert.doesNotMatch(sql,/\bcron\.schedule\s*\(|\bnet\.http_post\s*\(|\bhttp_post\s*\(/i);
});

