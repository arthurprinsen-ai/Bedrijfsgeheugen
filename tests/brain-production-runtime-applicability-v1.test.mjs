import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateSafeProductionSupersession, NON_PRODUCTION_EXACT } from '../tools/site-shell/production-supersession.mjs';

test('verifier-only main advances do not require a new Netlify deploy', async () => {
  const [release,snapshot,contract] = await Promise.all([
    readFile('.github/workflows/production-release-readback.yml','utf8'),
    readFile('.github/workflows/production-source-snapshot.yml','utf8'),
    readFile('brain/contracts/production-readback-v1.json','utf8').then(JSON.parse),
  ]);

  for (const path of [
    'tools/site-shell/contracts.mjs',
    'tools/site-shell/test-shell-components.mjs',
    'tools/site-shell/live-contract.mjs',
    'tools/site-shell/test-live-contract.mjs',
    'tools/site-shell/production-supersession.mjs',
    'brain/contracts/production-readback-v1.json',
  ]) {
    assert.ok(release.includes(path), `release classifier misses ${path}`);
    assert.ok(snapshot.includes(path), `snapshot ignore misses ${path}`);
    assert.ok(contract.productionTruth.verifierOnlyPaths.includes(path), `contract misses ${path}`);
    assert.ok(NON_PRODUCTION_EXACT.has(path), `production supersession misses verifier-only path ${path}`);
  }

  assert.match(release,/readbackControlPlaneOnly=changedPaths\.length>0 && runtimeChangedPaths\.length===0/);
  assert.match(release,/deploymentRequired=browserRequired \|\| netlifyRuntimeRequired/);
  assert.equal(contract.productionTruth.runtimeApplicabilityRequired,true);
  assert.equal(contract.productionTruth.verifierOnlyNoDeployment,true);
  assert.equal(contract.productionTruth.exactMatchAppliesWhenDeploymentRequired,true);
});

test('canonical live readback accepts an older live SHA only for an all-control-plane ancestor delta', async () => {
  const [workflow,contract] = await Promise.all([
    readFile('.github/workflows/canonical-brand-shell-live-readback.yml','utf8'),
    readFile('brain/contracts/production-readback-v1.json','utf8').then(JSON.parse),
  ]);

  assert.match(workflow,/Resolve runtime-applicable production commit/);
  assert.match(workflow,/git merge-base --is-ancestor/);
  assert.match(workflow,/git diff --name-only "\$observed\.\.\.\$HEAD_COMMIT"/);
  assert.match(workflow,/control-plane-ancestor/);
  assert.match(workflow,/steps\.runtime\.outputs\.accepted_runtime_commit/);
  assert.match(workflow,/tools\/site-shell\/contracts\.mjs/);
  assert.match(workflow,/brain\/contracts\/production-readback-v1\.json/);
  assert.equal(contract.productionTruth.controlPlaneAncestorAllowed,true);
  assert.equal(contract.productionTruth.controlPlaneAncestorRequiresAllDeltaNonRuntime,true);
  assert.equal(contract.websiteReadback.controlPlaneVerifierCanReadLiveAncestor,true);
});

test('production supersession allows verifier-only descendants but blocks runtime-affecting descendants', () => {
  const expected='a'.repeat(40);
  const observed='b'.repeat(40);
  const verifierOnly=evaluateSafeProductionSupersession({
    expectedCommit:expected,
    observedCommit:observed,
    expectedIsAncestor:true,
    changedPaths:[
      'tools/site-shell/live-contract.mjs',
      'tools/site-shell/test-live-contract.mjs',
      'brain/contracts/production-readback-v1.json',
      'docs/changes/readback.md',
      'tests/readback.test.mjs',
    ],
  });
  assert.equal(verifierOnly.ok,true);
  assert.equal(verifierOnly.mode,'safe-descendant');
  assert.deepEqual(verifierOnly.unsafePaths,[]);

  const runtime=evaluateSafeProductionSupersession({
    expectedCommit:expected,
    observedCommit:observed,
    expectedIsAncestor:true,
    changedPaths:[
      'tools/site-shell/live-contract.mjs',
      'prijzen.html',
    ],
  });
  assert.equal(runtime.ok,false);
  assert.equal(runtime.mode,'runtime-affecting-descendant');
  assert.deepEqual(runtime.unsafePaths,['prijzen.html']);
});

test('real website and Netlify runtime changes remain deployment-applicable', async () => {
  const [release,snapshot] = await Promise.all([
    readFile('.github/workflows/production-release-readback.yml','utf8'),
    readFile('.github/workflows/production-source-snapshot.yml','utf8'),
  ]);

  for (const prefix of ['netlify/functions/','platform/api/','platform/saas/','platform/connectors/','platform/read-models/']) {
    assert.match(release,new RegExp(prefix.replaceAll('/','\\/')));
  }
  assert.doesNotMatch(snapshot,/\n\s*- '\*\.html'/);
  assert.match(release,/netlifyRuntimeRequired=!readbackControlPlaneOnly && runtimeChangedPaths\.some/);
});
