import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(
  new URL('../supabase/migrations/20261113071500_original_content_handoff_source_revision_receipt_v1.sql', import.meta.url),
  'utf8',
);

test('original ONE BRAIN content transfer carries the same canonical source tenant, revision and idempotent correlation', () => {
  for (const evidence of [
    "'tenant_id',r.tenant_id",
    "'source_revision',to_char(r.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')",
    "'source_record_key',r.tenant_id||'|'||r.channel||'|'||r.publication_date::text",
    "'source_correlation_id',md5('original-content-handoff|'||r.channel||'|'||r.publication_date::text)",
    "'consumer_ack',jsonb_build_object(",
    "'accepted',true,'acceptance_scope','ORIGINAL_SOURCE_STATE_ONLY_NOT_PROVIDER_OUTCOME'",
    "'owner',v_owner,'source_status',r.status,'stage',v_stage",
    "'source_revision',to_char(r.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')",
    "'provider_proven',v_pub,'measurement_proven',v_metric",
    "'experiment_proven',v_reuse,'no_publish_veto_accepted',v_no_publish",
    "ON CONFLICT(obligation_type,capability_id,business_entity,business_period,business_timezone)",
  ]) assert.ok(sql.includes(evidence), 'missing exact source/consumer contract '+evidence);
  const correlation = "md5('original-content-handoff|'||r.channel||'|'||r.publication_date::text)";
  assert.ok(sql.split(correlation).length >= 4, 'BRAIN payload correlation must equal stable producer obligation identity');
  assert.doesNotMatch(sql,/source_correlation_id',\s*(?:gen_random_uuid|random|clock_timestamp)\(/i);
});

test('original CANCELLED no-publish receipts are backfilled once without post replay or fake learning', () => {
  const originalTerminal = sql.indexOf("b.state IS DISTINCT FROM 'CANCELLED'");
  const provenanceGate = sql.indexOf("b.evidence->>'source_revision' IS DISTINCT FROM");
  const ackGate = sql.indexOf("b.evidence#>>'{consumer_ack,source_revision}' IS DISTINCT FROM");
  assert.ok(originalTerminal >= 0 && provenanceGate > originalTerminal && ackGate > provenanceGate);
  assert.ok(sql.includes("OR b.evidence->>'tenant_id' IS DISTINCT FROM c.tenant_id"));
  assert.ok(sql.includes("OR b.evidence->>'source_correlation_id' IS DISTINCT FROM"));
  assert.ok(sql.includes("c.updated_at AT TIME ZONE 'UTC'"));
  assert.match(sql, /v_stage:='NO_PUBLISH_POLICY_ACK'/);
  assert.match(sql, /CASE WHEN v_no_publish THEN 'CANCELLED'/);
  assert.doesNotMatch(sql, /CASE WHEN v_no_publish THEN 'FULFILLED'/);
  assert.ok(sql.includes("'provider_send_allowed',false"));
  assert.ok(sql.includes("'measurement_or_learning_claimed',false"));
  assert.ok(sql.indexOf("v_stage:='OVERDUE_PROVIDER_READBACK'") < sql.indexOf("v_stage:='NO_PUBLISH_POLICY_ACK'"));
});

test('already provider-fulfilled historical outcomes are not reopened to artificially backfill provenance', () => {
  assert.ok(sql.includes("AND coalesce(b.state,'OPEN')<>'FULFILLED'"));
  assert.ok(sql.includes("AND c.publication_date<v_day-8"));
  assert.ok(sql.includes("LIMIT 48"));
  assert.ok(sql.includes("ORDER BY coalesce(b.updated_at,'epoch'::timestamptz)"));
  assert.ok(sql.includes("AND public.brain_obligations.evidence IS DISTINCT FROM excluded.evidence"));
});

test('original privilege and provider gates remain unchanged, no second scheduler or outbound side effects', () => {
  for(const guard of [
    "SECURITY DEFINER",
    "SET search_path TO 'pg_catalog', 'public'",
    "AND r.evidence->>'provider_truth_verified'='true'",
    "'provider_reference_reconciliation',jsonb_build_object(",
    "'ORIGINAL_SOURCE_EVENT_AND_OBSERVED_AT_SAME_ROW_V1'",
    "social_learning_obligations",
    "REVOKE ALL ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)",
    "FROM PUBLIC,anon,authenticated",
    "GRANT EXECUTE ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)",
    "TO service_role;"
  ]) assert.ok(sql.includes(guard), 'original authority guard missing: '+guard);
  assert.equal((sql.match(/CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1/g) || []).length, 1);
  assert.doesNotMatch(sql, /\bcron\.schedule\s*\(|\bnet\.http_post\s*\(|\bhttp_post\s*\(/i);
});
