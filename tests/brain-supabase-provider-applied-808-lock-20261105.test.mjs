import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const lock=JSON.parse(readFileSync('supabase/migration-history.lock.json','utf8'));
const version='20261105134200';
const name='original_data_spine_decision_receipt_same_tick_v1';
const source='supabase/migrations/'+version+'_'+name+'.sql';

test('original provider-applied 808th migration has exact version/name lock and real executable SQL',()=>{
  const rows=lock.applied.filter(x=>x.version===version);
  assert.deepEqual(rows,[{version,name}]);
  const sql=readFileSync(source,'utf8');
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_data_spine_watchdog_v1/);
  assert.match(sql,/foreach v_stage in array array\['decision','action','outcome','learning','guard'\]/);
  assert.match(sql,/commit;/i);
});
test('no newly invented provider history, no duplicate migration identity and historical entries intact',()=>{
  const names=new Set();
  for(const row of lock.applied){
    assert.match(row.version,/^\d{14}$/);
    assert.ok(row.name && typeof row.name==='string');
    assert.ok(!names.has(row.version),row.version);
    names.add(row.version);
  }
  assert.ok(lock.applied.length>=808,'never silently shrink the verified provider history');
  const sqls=readdirSync('supabase/migrations').filter(n=>/^\d{14}_.+\.sql$/.test(n));
  assert.ok(sqls.includes(version+'_'+name+'.sql'));
  assert.ok(lock.applied.every(r=>sqls.includes(r.version+'_'+r.name+'.sql')),'provider-applied identity must have exact executable source');
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.ok(Number.isFinite(Date.parse(lock.captured_at)), 'provider readback timestamp must be valid');
});
test('recorded ONE BRAIN evidence cannot claim later deployments green from mere source sync',()=>{
  const learn=JSON.parse(readFileSync('brain/learning/2026-11-05-supabase-migration-lock-808-provider-readback.json','utf8'));
  assert.equal(learn.status,'CODE_CANDIDATE_UNVERIFIED');
  assert.equal(learn.compiler.machine_enforceable,true);
  assert.equal(learn.production_readback,'EVIDENCE_DUE');
  assert.match(learn.root_cause,/807.*808/);
  assert.ok(learn.evaluation.historical_replay.includes('tests/brain-supabase-provider-applied-808-lock-20261105.test.mjs'));
});
