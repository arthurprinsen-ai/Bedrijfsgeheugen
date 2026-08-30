import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as deliverySystem from '../tools/brain-delivery-system.mjs';

const { createDeliveryPlan, discoverBrainMembership, evaluateBranchDrift } = deliverySystem;

test('backend website and portal changes become independently promotable v2 lanes', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({ changedPaths:['platform/api/brain-gateway.mjs','components/header/template.html','portal/core.mjs'], headSha:'abcdef1234567890', policy });
  assert.equal(plan.contractVersion, 'BRAIN-DELIVERY-v2');
  assert.equal(plan.traceId, 'delivery|abcdef123456');
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend','portal','website']);
  assert.equal(plan.integration.required, true);
  assert.equal(plan.integration.singleCandidate, false);
  assert.equal(plan.integration.independentPromotion, true);
  assert.equal(plan.lanes.every(lane => lane.independentPromotion === true), true);
  assert.equal(plan.lanes.every(lane => lane.candidateIdentity === 'abcdef1234567890'), true);
  assert.equal(plan.production.exactShaRequired, true);
  assert.equal(plan.production.authority, 'BG169');
  assert.equal(plan.branchPolicy.rebuildOnMainDrift, false);
  assert.equal(plan.registration.required, true);
  assert.equal(plan.registration.autoDiscover, true);
});

test('non-overlapping main drift never causes a branch rebuild', () => {
  assert.deepEqual(evaluateBranchDrift({ featurePaths:['portal/render-offer.mjs','tests/portal-native-legacy-batch-11.test.mjs'], mainDriftPaths:['blog/index.html','assets/css/powerhouse-kosten.css'], mergeable:true }), { action:'KEEP_TESTED_FEATURE', reason:'non-overlapping-main-drift', overlap:[] });
});

test('only actual overlap or merge conflict requires synchronization', () => {
  assert.deepEqual(evaluateBranchDrift({ featurePaths:['portal/app.mjs'], mainDriftPaths:['portal/app.mjs','blog/index.html'], mergeable:true }), { action:'SYNC_REQUIRED', reason:'changed-path-overlap', overlap:['portal/app.mjs'] });
  assert.equal(evaluateBranchDrift({ featurePaths:['portal/app.mjs'], mainDriftPaths:[], mergeable:false }).reason, 'merge-conflict');
});

test('shared contract changes fan out to every affected governance lane without one release candidate', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({ changedPaths:['config/outcome-obligations.json'], headSha:'1234567890abcdef', policy });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['automation','backend','portal','website']);
  assert.equal(plan.integration.singleCandidate, false);
});

test('canonical architecture specs can never bypass BRAIN delivery as ignored documentation', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const canonicalPath = 'docs/superpowers/specs/2026-08-30-brain-continuous-cicd-v2-design.md';
  const plan = createDeliveryPlan({ changedPaths:[canonicalPath], headSha:'deadcafe12345678', policy });
  assert.deepEqual(plan.ignoredPaths, []);
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['automation','backend','portal','website']);
  assert.equal(policy.ignoredPaths.includes('docs/superpowers/'), false);
});

test('new agents and workflow scenarios are automatically visible as Brain members', async () => {
  const membership = discoverBrainMembership({ registeredComponents:[{ key:'BG169', id:7137190, status:'active' }], agents:[{ id:'agent-new-builder', domains:['Website'] }], workflows:['.github/workflows/new-builder.yml'] });
  assert.deepEqual(membership.map(item => item.componentKey), ['agent:agent-new-builder','brain:BG169','github-workflow:new-builder']);
  assert.equal(membership.every(item => item.brainContractVersion === 'brain.v1'), true);
  assert.equal(membership.every(item => item.deliveryContractVersion === 'BRAIN-DELIVERY-v2'), true);
  assert.equal(membership.every(item => item.costManaged === true), true);
  assert.equal(membership.every(item => item.outcomeWritebackRequired === true), true);
});

test('unknown active delivery work fails closed before production', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  assert.throws(() => createDeliveryPlan({ changedPaths:['unowned/new-system.mjs'], headSha:'abcdef1234567890', policy }), /unclassified delivery path/);
});

test('a future workflow is automatically classified as shared Brain delivery work', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({ changedPaths:['.github/workflows/future-agent-scenario.yml'], headSha:'fedcba1234567890', policy });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['automation','backend','portal','website']);
});

test('legacy customer portal changes belong to the portal lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({ changedPaths:['klantportaal.html'], headSha:'1234abcdef567890', policy });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['portal']);
});

test('delivery workflow executes changed lanes in parallel and delegates production to Brain authority', async () => {
  const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
  assert.match(workflow, /fromJSON\(needs\.plan\.outputs\.matrix\)/);
  assert.match(workflow, /needs:\s*plan/);
  assert.match(workflow, /node tools\/brain-delivery-system\.mjs/);
  assert.match(workflow, /node scripts\/brain\/test-all\.mjs/);
  assert.match(workflow, /BG169/);
  assert.match(workflow, /BG168/);
  assert.match(workflow, /BG167/);
});

test('GitHub and Netlify are explicit governed Brain delivery platforms', async () => {
  const registry = JSON.parse(await readFile('docs/brain/component-registry.json', 'utf8'));
  const platforms = new Map(registry.components.map(component => [component.key, component]));
  for (const key of ['PLATFORM_GITHUB','PLATFORM_NETLIFY']) {
    assert.equal(platforms.get(key)?.status, 'active', `${key} must be active`);
    assert.equal(platforms.get(key)?.brain_contract_version, 'brain.v1');
    assert.equal(platforms.get(key)?.cortex, 'PRODUCTION_RELIABILITY');
  }
});

test('Netlify deploy source rejects a linked worktree before upload', () => {
  assert.equal(typeof deliverySystem.evaluateNetlifyDeploySource, 'function');
  assert.deepEqual(deliverySystem.evaluateNetlifyDeploySource({ gitDir:'/repo/.git/worktrees/feature', gitCommonDir:'/repo/.git', headSha:'a'.repeat(40), expectedSha:'a'.repeat(40), treeSha:'b'.repeat(40) }), { ok:false, state:'DEPLOY_SOURCE_REJECTED', action:'STAGE_STANDALONE_EXACT_SHA', reason:'linked_git_worktree' });
});

test('Netlify deploy source accepts only a standalone exact-SHA checkout', () => {
  assert.deepEqual(deliverySystem.evaluateNetlifyDeploySource({ gitDir:'/deploy/.git', gitCommonDir:'/deploy/.git', headSha:'a'.repeat(40), expectedSha:'a'.repeat(40), treeSha:'b'.repeat(40) }), { ok:true, state:'DEPLOY_SOURCE_READY', action:'DEPLOY_EXACT_SHA', headSha:'a'.repeat(40), treeSha:'b'.repeat(40) });
  assert.deepEqual(deliverySystem.evaluateNetlifyDeploySource({ gitDir:'/deploy/.git', gitCommonDir:'/deploy/.git', headSha:'c'.repeat(40), expectedSha:'a'.repeat(40), treeSha:'b'.repeat(40) }), { ok:false, state:'DEPLOY_SOURCE_REJECTED', action:'CHECKOUT_EXACT_SHA', reason:'head_sha_mismatch' });
});

test('deploy-preflight CLI reports the actual Git source topology and governance requires it', async () => {
  const head = spawnSync('git', ['rev-parse','HEAD'], { encoding:'utf8' }).stdout.trim();
  const gitDir = spawnSync('git', ['rev-parse','--git-dir'], { encoding:'utf8' }).stdout.trim();
  const commonDir = spawnSync('git', ['rev-parse','--git-common-dir'], { encoding:'utf8' }).stdout.trim();
  const linked = resolve(gitDir) !== resolve(commonDir);
  const result = spawnSync(process.execPath, ['tools/brain-delivery-system.mjs','deploy-preflight','--sha',head], { encoding:'utf8' });
  const governance = await readFile('AGENTS.md', 'utf8');
  assert.equal(result.status, linked ? 1 : 0);
  assert.match(linked ? result.stderr : result.stdout, linked ? /STAGE_STANDALONE_EXACT_SHA/ : /DEPLOY_SOURCE_READY/);
  assert.match(governance, /brain-delivery-system\.mjs deploy-preflight --sha/);
});
