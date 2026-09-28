import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import policy from '../config/powerhouse-production-impact-v1.json' with { type: 'json' };
import { classifyProductionImpact } from '../tools/delivery/production-impact.mjs';

test('delivery control-plane changes close on protected main containment', () => {
  const result = classifyProductionImpact({
    changedPaths:[
      'tools/delivery/integration-bundle-compiler.mjs',
      'brain/learning/example.json',
      'docs/changes/example.md',
      '.agents/skills/powerhouse-delivery-self-optimization/SKILL.md',
      'tests/example.test.mjs'
    ],
    policy
  });
  assert.equal(result.productionReadbackRequired,false);
  assert.equal(result.mode,'GITHUB_MAIN_CONTAINMENT');
});

test('production-bearing runtime path still requires provider readback', () => {
  const result = classifyProductionImpact({changedPaths:['portal-v2/app.js'],policy});
  assert.equal(result.productionReadbackRequired,true);
  assert.deepEqual(result.productionBearingPaths,['portal-v2/app.js']);
});

test('mixed control-plane and runtime changes remain fail-closed to production readback', () => {
  const result = classifyProductionImpact({
    changedPaths:['docs/changes/x.md','netlify/functions/api.mjs'],
    policy
  });
  assert.equal(result.productionReadbackRequired,true);
});

test('production impact ignore policy stays in parity with both canonical production workflows', async () => {
  const snapshot = await readFile('.github/workflows/production-source-snapshot.yml','utf8');
  const readback = await readFile('.github/workflows/production-release-readback.yml','utf8');
  const requiredPatterns=[
    "'docs/**'",
    "'.agents/**'",
    "'tests/**'",
    "'.github/**'",
    "'brain/learning/**'",
    "'tools/delivery/**'",
    "'brain/policies/**'",
    "'config/delivery-prevention-rules.json'",
    "'tools/site-shell/verify-targeted-website-routes.mjs'",
    "'AGENTS.md'"
  ];
  for(const pattern of requiredPatterns){
    assert.ok(snapshot.includes(pattern),`snapshot missing ${pattern}`);
    assert.ok(readback.includes(pattern),`readback missing ${pattern}`);
  }
});


test('terminal closure derives production applicability from production-impact authority, not lane name', async () => {
  const workflow = await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow, /CHANGED_PATHS="\$\{changed_paths\}" node tools\/delivery\/production-impact\.mjs/);
  assert.match(workflow, /productionReadbackRequired===true/);
  assert.match(workflow, /CONTROL_PLANE_MAIN_READBACK_PROVEN/);
  assert.doesNotMatch(workflow, /DELIVERY_LANE}" = "automation"/);
});
