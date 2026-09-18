import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const required=fs.readFileSync('.github/workflows/required-test.yml','utf8');
const turbo=fs.readFileSync('.github/workflows/lane-turbo.yml','utf8');
const policy=JSON.parse(fs.readFileSync('config/powerhouse-turbo-delivery-v1.json','utf8'));

test('Required classifies turbo before heavy suites',()=>{
  assert.match(required,/classifyTurboDelivery/);
  assert.match(required,/turbo=\$\{turboDecision\.turbo\}/);
  assert.match(required,/if: steps\.scope\.outputs\.turbo != 'true'/);
  assert.match(required,/uses: \.\/\.github\/workflows\/lane-turbo\.yml/);
});
test('Turbo lane is bounded and exact-candidate scoped',()=>{
  assert.match(turbo,/timeout-minutes:\s*4/);
  assert.match(turbo,/ref: \$\{\{ inputs\.candidate_sha \}\}/);
  assert.match(turbo,/classifyTurboDelivery/);
  assert.doesNotMatch(turbo,/npm install/);
});
test('Turbo policy keeps production readback and rollback hard',()=>{
  assert.equal(policy.turbo.production_readback,true);
  assert.equal(policy.recovery.conflict,'rebase_or_rebuild_same_lineage_from_current_main');
  assert.equal(policy.success,'LIVE & BEWEZEN');
});

test('Unified Brain Delivery is turbo-aware but keeps BG169 promotion',()=>{
  const brain=fs.readFileSync('.github/workflows/unified-brain-delivery.yml','utf8');
  assert.match(brain,/TURBO_BRAIN_LANE/);
  assert.match(brain,/classifyTurboDelivery/);
  assert.match(brain,/BG169 GitHub-native production transport/);
  assert.match(brain,/timeout-minutes:\s*7/);
});
