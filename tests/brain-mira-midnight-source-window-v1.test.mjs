import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../supabase/migrations/20261009140200_mira_prepared_signal_proof_window_v1.sql',import.meta.url),'utf8');
const valid = ({observedAt,eligible,evidenceScore,totalScore,now}) =>
  new Date(observedAt).getTime() >= new Date(now).getTime()-86400000 &&
  eligible === true && evidenceScore>=0.40 && totalScore>=0.75;

test('pre-midnight harvest counts tomorrow only while genuinely fresh and qualified',()=>{
  const now='2026-10-09T13:55:00Z';
  assert.equal(valid({observedAt:'2026-10-08T20:02:11Z',eligible:true,evidenceScore:0.67,totalScore:0.908,now}),true);
  assert.equal(valid({observedAt:'2026-10-08T20:02:11Z',eligible:false,evidenceScore:0.67,totalScore:0.908,now}),false);
  assert.equal(valid({observedAt:'2026-10-08T20:02:11Z',eligible:true,evidenceScore:0.02,totalScore:0.908,now}),false);
  assert.equal(valid({observedAt:'2026-10-07T20:02:11Z',eligible:true,evidenceScore:0.67,totalScore:0.908,now}),false);
  assert.equal(valid({observedAt:'2026-10-08T20:02:11Z',eligible:true,evidenceScore:0.67,totalScore:0.6,now}),false);
});
test('repair reuses one existing production function and protects original grants',()=>{
  assert.match(migration,/powerhouse_refresh_regression_stage_evidence_v1/);
  assert.match(migration,/pg_get_functiondef/);
  assert.match(migration,/MIRA_SOURCE_WINDOW_REBASE_REQUIRED/);
  assert.match(migration,/MIRA_ASSURANCE_PRIVILEGE_DRIFT/);
  assert.match(migration,/observed_at >= p_now-interval/);
  assert.match(migration,/eligible = true/);
  assert.match(migration,/evidence_score >= 0\.40/);
  assert.match(migration,/total_score >= 0\.75/);
  assert.doesNotMatch(migration,/insert\s+into\s+public\.powerhouse_mira_problem_signals_v1/i);
});
