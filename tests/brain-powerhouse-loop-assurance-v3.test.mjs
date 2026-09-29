import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260929212500_powerhouse_loop_assurance_v3.sql','utf8');

test('loop assurance v3 syncs only from canonical cron/runtime evidence',()=>{
  assert.match(sql,/powerhouse_sync_loop_assurance_receipts_v1/);
  assert.match(sql,/cron\.job_run_details/);
  assert.match(sql,/powerhouse_runtime_events/);
  assert.match(sql,/canonical-runtime-and-cron-only/);
});

test('critical loop with zero fresh stage evidence fails RED',()=>{
  assert.match(sql,/v_fresh_stage_count=0 and r\.critical/);
  assert.match(sql,/critical loop has zero fresh closed-loop stage evidence/);
});

test('assurance obligations preserve immutable identity',()=>{
  const updateClause=sql.split('on conflict \(obligation_type,capability_id,business_entity,business_period,business_timezone\)')[1]||'';
  assert.doesNotMatch(updateClause,/payload_sha256\s*=/);
});

test('aggregate loop integrity view exposes red amber green truth',()=>{
  assert.match(sql,/powerhouse_loop_integrity_health_v1/);
  assert.match(sql,/fully_evidenced_loops/);
  assert.match(sql,/zero_stage_evidence_loops/);
  assert.match(sql,/overall_status/);
});
