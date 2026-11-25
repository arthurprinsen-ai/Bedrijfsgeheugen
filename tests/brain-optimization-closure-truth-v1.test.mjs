import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261008173100_powerhouse_optimization_closure_truth_v1.sql',import.meta.url),'utf8');

test('one read-only proof projection, no parallel store or job',()=>{
 assert.match(sql,/create or replace view public\.powerhouse_optimization_closure_truth_v1/);
 assert.match(sql,/create or replace view public\.powerhouse_self_improvement_control_v1/);
 assert.match(sql,/with \(security_invoker = true\)/);
 assert.doesNotMatch(sql,/\bcreate\s+table\b|\bcron\.schedule\b|\bcreate\s+trigger\b/i);
 assert.match(sql,/revoke all on public\.powerhouse_optimization_closure_truth_v1\s+from public,anon,authenticated/);
});

test('review is independently approved, not inferred from policy status',()=>{
 assert.match(sql,/from public\.powerhouse_human_feedback_events h/);
 assert.match(sql,/h\.feedback_type='approve'/);
 assert.match(sql,/h\.evidence->>'verified'='true'/);
 assert.match(sql,/review_receipt_ref/);
 assert.doesNotMatch(sql,/human_review_required'\s*=\s*'false'/);
});

test('release requires production receipt and exact candidate identity',()=>{
 assert.match(sql,/from public\.brain_delivery_evidence d/);
 assert.match(sql,/d\.candidate_identity=d\.tested_identity/);
 assert.match(sql,/d\.remote_ref=c\.outcome_evidence->>'production_readback_id'/);
 for(const field of ['release_revision','security_guard_passed','regression_guard_passed','quality_guard_passed'])
  assert.ok(sql.includes(field));
});

test('realized observation excludes outbound acknowledgements and synthetic evidence',()=>{
 assert.match(sql,/from public\.powerhouse_realized_values v/);
 assert.match(sql,/v\.source_entity_id=c\.candidate_id::text/);
 assert.match(sql,/v\.tenant_id=c\.tenant_id/);
 assert.match(sql,/independent_readback_id/);
 for(const state of ['not_executed','execution_completed','sent','reply_received'])assert.ok(sql.includes(state));
 assert.match(sql,/v\.currency='EUR' and v\.unit='EUR'/);
 assert.doesNotMatch(sql,/count\(\*\)\s*filter\s*\(\s*where\s+coalesce\(measured_outcome/);
});

test('terminal closure requires canonical verified learning; never claims causal uplift',()=>{
 assert.match(sql,/from public\.brain_records b/);
 assert.match(sql,/b\.record_kind='learning'/);
 assert.match(sql,/b\.executed is true and b\.verified is true/);
 assert.match(sql,/cardinality\(b\.evidence_ids\)>0/);
 assert.match(sql,/OBSERVED_CYCLE_VERIFIED_NOT_CAUSAL_UPLIFT/);
 assert.match(sql,/INDEPENDENT_MEASUREMENT_REQUIRED/);
 assert.match(sql,/LEARNING_WRITEBACK_REQUIRED/);
});
