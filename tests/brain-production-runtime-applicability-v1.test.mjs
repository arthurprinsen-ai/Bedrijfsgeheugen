import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateSafeProductionSupersession, NON_PRODUCTION_EXACT } from '../tools/site-shell/production-supersession.mjs';
import { deriveNetlifyDeploymentApplicability, NETLIFY_GOVERNANCE_EXACT, NETLIFY_RUNTIME_PREFIXES, NETLIFY_RUNTIME_EXACT } from '../tools/delivery/netlify-deployment-applicability.mjs';

test('verifier-only main advances do not require a new Netlify deploy', async () => {
  const [release, snapshot, authority, contract, policy] = await Promise.all([
    readFile('.github/workflows/production-release-readback.yml', 'utf8'),
    readFile('.github/workflows/production-source-snapshot.yml', 'utf8'),
    readFile('tools/delivery/netlify-deployment-applicability.mjs', 'utf8'),
    readFile('brain/contracts/production-readback-v1.json', 'utf8').then(JSON.parse),
    readFile('config/brain-delivery-system.json', 'utf8').then(JSON.parse),
  ]);
  const headSha = 'a'.repeat(40);
  const verifierOnlyPaths = [
    'tools/site-shell/contracts.mjs',
    'tools/site-shell/test-shell-components.mjs',
    'tools/site-shell/live-contract.mjs',
    'tools/site-shell/test-live-contract.mjs',
    'tools/site-shell/production-supersession.mjs',
    'tools/site-shell/standalone-visibility-check.mjs',
    'brain/contracts/production-readback-v1.json',
  ];

  // Both workflows invoke the shared classifier; old inline path lists are not authority.
  assert.ok(release.includes('deriveNetlifyDeploymentApplicability'));
  assert.ok(snapshot.includes('deriveNetlifyDeploymentApplicability'));
  assert.ok(authority.includes('deploymentRequired=forceDeployment || browserRequired || netlifyRuntimeRequired'));
  for (const path of verifierOnlyPaths) {
    assert.ok(contract.productionTruth.verifierOnlyPaths.includes(path), `contract misses ${path}`);
    assert.ok(NETLIFY_GOVERNANCE_EXACT.has(path), `canonical classifier misses ${path}`);
    assert.ok(NON_PRODUCTION_EXACT.has(path), `production supersession misses ${path}`);
    const verdict=deriveNetlifyDeploymentApplicability({changedPaths:[path],headSha,policy});
    assert.deepEqual(verdict.runtimeChangedPaths, [], `unexpected runtime path: ${path}`);
    assert.equal(verdict.deploymentRequired, false, `unexpected Netlify deploy: ${path}`);
  }
  assert.ok(release.includes('readbackControlPlaneOnly=changedPaths.length>0 && runtimeChangedPaths.length===0'));
  assert.equal(contract.productionTruth.runtimeApplicabilityRequired, true);
  assert.equal(contract.productionTruth.verifierOnlyNoDeployment, true);
  assert.equal(contract.productionTruth.exactMatchAppliesWhenDeploymentRequired, true);
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
  const [release,snapshot,policy] = await Promise.all([
    readFile('.github/workflows/production-release-readback.yml','utf8'),
    readFile('.github/workflows/production-source-snapshot.yml','utf8'),
    readFile('config/brain-delivery-system.json','utf8').then(JSON.parse),
  ]);
  const headSha='a'.repeat(40);
  assert.ok(release.includes('deriveNetlifyDeploymentApplicability'));
  assert.ok(snapshot.includes('deriveNetlifyDeploymentApplicability'));
  assert.ok(release.includes("steps.scope.outputs.deployment_required == 'true'"));
  for (const prefix of ['netlify/functions/','platform/api/','platform/saas/','platform/connectors/','platform/read-models/']) {
    assert.ok(NETLIFY_RUNTIME_PREFIXES.includes(prefix), `runtime prefix missing: ${prefix}`);
    const path=`${prefix}production-applicability-canary.mjs`;
    const verdict=deriveNetlifyDeploymentApplicability({changedPaths:[path],headSha,policy});
    assert.deepEqual(verdict.runtimeChangedPaths,[path]);
    assert.equal(verdict.netlifyRuntimeRequired,true, `Netlify runtime not required for ${path}`);
    assert.equal(verdict.deploymentRequired,true, `Netlify deploy not required for ${path}`);
  }
  const shared='platform/runtime/attested-cloud-ai.mjs';
  assert.ok(NETLIFY_RUNTIME_EXACT.has(shared));
  const sharedVerdict=deriveNetlifyDeploymentApplicability({changedPaths:[shared],headSha,policy});
  assert.equal(sharedVerdict.deploymentRequired,true, 'shared AI runtime dependency must deploy');
  const website=deriveNetlifyDeploymentApplicability({changedPaths:['prijzen.html'],headSha,policy});
  assert.equal(website.websiteRequired,true);
  assert.equal(website.browserRequired,true);
  assert.equal(website.deploymentRequired,true);
  assert.ok(!snapshot.includes("- '*.html'"));
});
