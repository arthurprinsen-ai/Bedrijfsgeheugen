import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync('.github/workflows/social-publication-recovery.yml','utf8');
const runner=readFileSync('supabase/functions/social-recovery-runner/index.ts','utf8');

test('scheduled social decisions cannot pass the recovery acceptance gate',()=>{
  assert.match(workflow,/const unresolved=required\.filter\(d=>d\.state!=='published'\)/);
  assert.doesNotMatch(workflow,/const unresolved=required\.filter\(d=>!\['published','scheduled'\]/);
});
test('workflow fails closed without provider-side proof',()=>{
  assert.match(workflow,/safe\.providerTruthHealthy!==true/);
  assert.match(workflow,/!safe\.ok/);
  assert.match(runner,/providerTruthHealthy/);
  assert.match(runner,/providerSideEffectTruthHealthy/);
});
test('canonical publisher remains sole provider writer',()=>{
  assert.match(runner,/"powerhouse-social-publisher"/);
  assert.match(runner,/mode: "publish_only"/);
});
