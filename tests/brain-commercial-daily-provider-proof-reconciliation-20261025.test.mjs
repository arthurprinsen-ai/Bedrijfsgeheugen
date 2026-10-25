import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync('supabase/migrations/20261025110200_commercial_daily_provider_evidence_reconciliation.sql','utf8');

test('same-date, same-tenant and exact channel identity are mandatory for canonical proof',()=>{
  assert.match(migration,/o\.tenant_id='canonical'/);
  assert.match(migration,/o\.publication_date=d\.run_date/);
  assert.match(migration,/o\.channel=CASE WHEN d\.channel='instagram_company' THEN 'instagram' ELSE d\.channel END/);
  assert.match(migration,/delivery_ref=coalesce\(external_id,canonical_url\)/);
  assert.match(migration,/delivery_ref=external_id/);
  assert.match(migration,/obligation_status='LIVE_PROVEN'/);
  assert.match(migration,/live_proven_at IS NOT NULL/);
  assert.match(migration,/obligation_evidence->>'provider_truth_verified'='true'/);
});
test('provider-create ack and permission limitation never forge independently read-back status',()=>{
  assert.match(migration,/AS independently_proven/);
  assert.match(migration,/AS terminal_permission_limited_ack/);
  assert.match(migration,/obligation_status='PUBLISHED'/);
  assert.match(migration,/obligation_evidence->>'provider_create_success'='true'/);
  assert.match(migration,/obligation_evidence->>'provider_publication_ack_verified'='true'/);
  assert.match(migration,/obligation_evidence->>'terminal_provider_side_effect'='true'/);
  assert.match(migration,/obligation_evidence->>'readback_permission_limited'='true'/);
  assert.match(migration,/obligation_evidence->>'republish_forbidden'='true'/);
  assert.match(migration,/count\(\*\) FILTER \(WHERE independently_proven\)::int delivered_publish_count/);
  assert.match(migration,/count\(\*\) FILTER \(WHERE terminal_permission_limited_ack\)::int terminal_permission_limited_count/);
  assert.match(migration,/NOT \(independently_proven OR terminal_permission_limited_ack\)/);
  assert.match(migration,/COALESCE\(\(/);
  assert.match(migration,/false\) AS independently_proven/);
  assert.match(migration,/false\) AS terminal_permission_limited_ack/);
});
test('a channel hold is not a fabricated publish, and day remains protected by separate publication/predictive guards',()=>{
  assert.match(migration,/decision='publish'/);
  assert.match(migration,/state IN \('published','measured','learned'\)/);
  assert.match(migration,/execution_complete',decision_count=7 AND unresolved_publish_count=0/);
  assert.doesNotMatch(migration,/content_publication_obligations\s+SET|powerhouse_channel_decisions\s+SET/i);
  assert.doesNotMatch(migration,/cron\.schedule|cron\.unschedule|net\.http_post|GRANT EXECUTE TO (anon|authenticated)/i);
  const guard=readFileSync('supabase/migrations/20260915091805_powerhouse_publication_live_proof_guard.sql','utf8');
  assert.match(guard,/and coalesce\(\(pub->>'healthy'\)::boolean,false\)/i);
});
