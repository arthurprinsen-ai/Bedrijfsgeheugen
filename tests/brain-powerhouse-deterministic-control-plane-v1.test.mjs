import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const path='supabase/migrations/20260918132600_powerhouse_deterministic_control_plane_vertical_slice_v1.sql';
const sql=fs.readFileSync(path,'utf8');

test('control plane reuses canonical Brain stores',()=>{
  assert.match(sql,/alter table public\.brain_delivery_evidence/i);
  assert.match(sql,/public\.brain_obligations/i);
  assert.match(sql,/public\.brain_operations/i);
  assert.match(sql,/public\.brain_control_plane_bindings/i);
  assert.doesNotMatch(sql,/create\s+table\s+/i);
});

test('control plane refuses active Make target',()=>{
  const recordFn=sql.match(/create or replace function public\.powerhouse_control_plane_record_stage_v1[\s\S]*?end\n\$function\$/i)?.[0]||'';
  assert.match(recordFn,/INVALID_ACTIVE_TARGET/);
  assert.doesNotMatch(recordFn,/'make'/i);
});

test('terminal closure requires production, outcome and learning evidence',()=>{
  const closeFn=sql.match(/create or replace function public\.powerhouse_control_plane_close_v1[\s\S]*?end\n\$function\$/i)?.[0]||'';
  for (const stage of ['USER_INTENT','EXECUTION','PROD_READBACK','OUTCOME','LEARNING']) {
    assert.match(closeFn,new RegExp(stage));
  }
  assert.match(closeFn,/SKILL_PROJECTION_EVIDENCE_REQUIRED/);
  assert.match(closeFn,/LEARNING_PREVENTION_NOT_COMPILED/);
  assert.match(closeFn,/'FULFILLED'/);
});

test('learning compiler routes machine-enforceable failures below prompt level',()=>{
  assert.match(sql,/DATABASE_CONSTRAINT/);
  assert.match(sql,/CI_GATE/);
  assert.match(sql,/CI_SECURITY_GATE/);
  assert.match(sql,/RUNTIME_ASSERTION/);
  assert.match(sql,/WORKFLOW/);
  assert.match(sql,/TEST/);
  assert.match(sql,/SKILL/);
});

test('production selftest covers complete vertical slice',()=>{
  assert.match(sql,/powerhouse_control_plane_selftest_v1/);
  for (const stage of ['EXECUTION','PROD_READBACK','OUTCOME','LEARNING']) {
    assert.match(sql,new RegExp(`selftest[\\s\\S]*${stage}`,'i'));
  }
  assert.match(sql,/powerhouse_control_plane_close_v1/);
});

test('active production authority has no Make transport',()=>{
  const cfg=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
  const transports=cfg.integration?.productionAuthorityContract?.transports||[];
  assert.deepEqual(transports.map(x=>x.id),['github-native']);
  assert.equal(transports[0]?.mode,'primary');
  assert.equal(cfg.integration?.productionAuthorityContract?.retiredTransports?.find(x=>x.id==='make')?.active,false);
});
