import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Replay the existing supervisor suite as Brain-compatible historical,
// shadow and canary evidence without duplicating the regression source.
import './delivery-powerhouse-supervisor.test.mjs';

test('Required rejects invalid changed Brain learning before protected merge',()=>{
  const yml=fs.readFileSync('.github/workflows/required-test.yml','utf8');
  assert.match(yml,/Evaluate changed Brain learning before protected merge/);
  assert.match(yml,/POWERHOUSE_BASE_SHA: \$\{\{ steps\.scope\.outputs\.base_sha \}\}/);
  assert.match(yml,/POWERHOUSE_HEAD_SHA: \$\{\{ steps\.scope\.outputs\.change_head_sha \}\}/);
  assert.match(yml,/run: node scripts\/brain\/learning-canonicalization-gate\.mjs/);
  const preflightGate=yml.indexOf('Evaluate changed Brain learning before protected merge');
  const integration=yml.indexOf('Compile one-write integration bundle');
  assert.ok(preflightGate>0 && integration>preflightGate);
});

test('Brain learning evaluates a real in-repository regression, not a missing or non-Brain path',()=>{
  const record=JSON.parse(fs.readFileSync('brain/learning/2026-10-08-github-delivery-continuity-v1.json','utf8'));
  for(const mode of ['historical_replay','shadow','canary']){
    assert.deepEqual(record.evaluation[mode],['tests/brain-github-delivery-continuity-v1.test.mjs']);
  }
  assert.ok(['NOT_PROVEN','LIVE_PROVEN'].includes(record.production_claim));
  if(record.production_claim==='LIVE_PROVEN'){
    assert.ok(record.production_readback?.merge_sha,'live claim must include merge proof');
    assert.ok(record.production_readback?.verified===true,'live claim must include verified provider readback');
  }
});
