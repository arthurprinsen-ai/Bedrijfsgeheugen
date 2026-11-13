import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const lock = JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));
const newIdentity = {version:'20261113174500', name:'original_social_learning_source_ack_v1'};
const previous = {version:'20261113164000', name:'original_seo_one_chain_outcome_assurance_v2'};
const migrationUrl = new URL('../supabase/migrations/20261113174500_original_social_learning_source_ack_v1.sql', import.meta.url);

test('original provider 850 source lock appends one exactly verified migration after original 849', () => {
  assert.equal(lock.project_ref, 'adhjwmvyoixzjtmiroln');
  assert.equal(lock.source, 'supabase_migration_history');
  assert.ok(Array.isArray(lock.applied) && lock.applied.length >= 850);
  assert.deepEqual(lock.applied[848], previous);
  assert.deepEqual(lock.applied[849], newIdentity);
  assert.equal(lock.applied.filter(x=>x.version===newIdentity.version).length,1);
  assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
  assert.ok(lock.applied.every((x,i)=>i===0||x.version>lock.applied[i-1].version));
  assert.equal(lock.captured_at, '2026-11-13T18:05:43.826407Z');
});

test('original receipt migration is source-backed and keeps the same execution and security boundary', () => {
  assert.ok(existsSync(migrationUrl));
  const sql=readFileSync(migrationUrl,'utf8');
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1\(/);
  assert.match(sql,/RECEIVED_SOURCE_ONLY_NOT_PROVIDER_MEASUREMENT_OR_LEARNING/);
  assert.match(sql,/\$function\$;\s*REVOKE ALL ON FUNCTION/);
  assert.match(sql,/from PUBLIC, anon, authenticated/i);
  assert.doesNotMatch(sql,/\bcron\.schedule\b|\bCREATE\s+TRIGGER\b/i);
});

test('brain release proof is precise about source acknowledgement vs provider results',()=>{
  const brain=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-13-original-social-learning-source-ack-v1.json',import.meta.url),'utf8'));
  assert.equal(brain.production_proof.source_revision_payload_correlation_and_consumer_ack_exact,185);
  assert.equal(brain.production_proof.source_revision_missing_or_drift,0);
  assert.equal(brain.production_proof.unsupported_provider_metric_learning_truth_claims,0);
  assert.equal(brain.verification.public_post_or_revenue_proven,false);
  assert.equal(brain.production_success,false);
});
