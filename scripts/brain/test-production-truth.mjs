import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration='supabase/migrations/20260831_brain_production_truth.sql';

test('P0 Production Truth derives green from fresh observation and never exposes SetGreen',()=>{
  assert.equal(fs.existsSync(migration),true,'Production Truth migration must exist');
  const sql=fs.readFileSync(migration,'utf8');

  for(const required of [
    'brain_desired_states',
    'brain_observed_states',
    'brain_production_truth',
    'GREEN_VERIFIED',
    'GREEN_STALE',
    'DRIFTED',
    'UNKNOWN',
    'valid_until',
    'brain_register_desired_state',
    'brain_observe_production_state',
    'brain_reconcile_production_truth'
  ]) assert.match(sql,new RegExp(required),`missing ${required}`);

  assert.match(sql,/brain_observed_states[\s\S]*append-only/i,'observations must be documented append-only');
  assert.match(sql,/enable row level security/i,'RLS required');
  assert.match(sql,/service_role/i,'server-only mutation required');
  assert.doesNotMatch(sql,/\bSetGreen\b|brain_set_green|set_green/i,'direct green setter forbidden');
});
