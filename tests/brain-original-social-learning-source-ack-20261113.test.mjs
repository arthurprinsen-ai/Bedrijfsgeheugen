import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261113174500_original_social_learning_source_ack_v1.sql',import.meta.url),'utf8');
const original=sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.powerhouse_content_handoff_receipts_v1'));
test('only original #171 content receiver is replaced; no parallel executor',()=>{
 assert.match(original,/CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1\(/);
 assert.match(original,/FOR slo IN[\s\S]*SELECT x\.\*, b\.evidence AS prior_brain_evidence/);
 assert.match(original,/LIMIT 48[\s\S]*v_learning_scanned/);
 assert.doesNotMatch(sql,/\bCREATE\s+(?:EXTENSION|TRIGGER|TABLE|VIEW)\b|\bcron\.schedule\s*\(/i);
});
test('actual social-learning source identity binds every ACK to revision, payload and correlation',()=>{
 for (const t of ["'tenant_id',slo.tenant_id","'obligation_id',slo.obligation_id","'type',slo.type","'owner',slo.owner","'post_id',slo.post_id","'window_hours',slo.window_hours","'due_at',slo.due_at","'status',slo.status","'updated_at',slo.updated_at","'payload',coalesce(slo.payload"]) assert.ok(sql.includes(t),t);
 assert.match(sql,/v_social_source_rev:=encode\(sha256\(convert_to\(jsonb_build_object\(/);
 assert.match(sql,/v_social_payload_sha:=encode\(sha256/);
 assert.match(sql,/'source_revision',v_social_source_rev/);
 assert.match(sql,/'source_payload_sha256',v_social_payload_sha/);
 assert.match(sql,/'source_correlation_id',v_social_correlation_id/);
 assert.match(sql,/'consumer_ack',jsonb_build_object\([\s\S]*'source_revision',v_social_source_rev[\s\S]*'source_payload_sha256',v_social_payload_sha[\s\S]*'source_correlation_id',v_social_correlation_id/);
});
test('ACK is idempotent for same immutable source and renewed only on actual revision change',()=>{
 assert.match(sql,/prior_brain_evidence#>>'\{consumer_ack,source_revision\}'=v_social_source_rev/);
 assert.match(sql,/prior_brain_evidence#>>'\{consumer_ack,source_payload_sha256\}'=v_social_payload_sha/);
 assert.match(sql,/prior_brain_evidence#>>'\{consumer_ack,source_correlation_id\}'=v_social_correlation_id/);
 assert.match(sql,/THEN slo\.prior_brain_evidence#>>'\{consumer_ack,accepted_at\}'/);
 assert.match(sql,/ELSE to_char\(p_now AT TIME ZONE 'UTC'/);
 assert.match(sql,/WHERE public\.brain_obligations\.owner IS DISTINCT FROM excluded\.owner/);
});
test('source receipt is not provider, learning, or revenue evidence; preserve original anti-duplicate and ACL',()=>{
 assert.match(sql,/RECEIVED_SOURCE_ONLY_NOT_PROVIDER_MEASUREMENT_OR_LEARNING/);
 assert.match(sql,/'provider_proven',false,'measurement_proven',false,'learning_proven',false/);
 assert.match(sql,/'forbid_unsupported_repost',true/);
 assert.match(sql,/'no_synthetic_experiment_winner',true/);
 assert.match(sql,/'no_claimed_provider_approval',true/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)/);
 assert.match(sql,/has_function_privilege\('service_role'/);
});
