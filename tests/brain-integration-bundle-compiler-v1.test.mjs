import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import adaptivePolicy from '../config/powerhouse-adaptive-delivery-v1.json' with { type: 'json' };
import integrationPolicy from '../config/powerhouse-integration-bundle-v1.json' with { type: 'json' };
import { compileClosurePlan, compileIntegrationBundle, compilePrContract } from '../tools/delivery/integration-bundle-compiler.mjs';

const base = '1111111111111111111111111111111111111111';
const head = '2222222222222222222222222222222222222222';

test('integration bundle compiles risk closure PR contract and exactly one writer intent', () => {
  const changedPaths = [
    'tools/example.mjs',
    'brain/learning/example.json',
    'docs/changes/example.md',
    'docs/development-ledger-events/example.md'
  ];
  const bundle = compileIntegrationBundle({
    changedPaths,
    metadata: { obligationId:'example-v1', deliveryLane:'backend', candidateType:'implementation', baseSha:base, supersedes:null },
    baseSha:base,
    headSha:head,
    prNumber:42,
    adaptivePolicy,
    integrationPolicy
  });
  assert.equal(bundle.writerIntent.mode, 'ONE_WRITE_INTEGRATION');
  assert.equal(bundle.writerIntent.maxTerminalWritersPerObligation, 1);
  assert.equal(bundle.writerIntent.exactHeadSha, head);
  assert.equal(bundle.closure.ready, true);
  assert.equal(bundle.closure.material, true);
  assert.match(bundle.prContract.text, /Obligation-ID: example-v1/);
  assert.match(bundle.bundleHash, /^[0-9a-f]{64}$/);
});

test('bundle identity is deterministic regardless of changed path ordering', () => {
  const input = {
    metadata: { obligationId:'stable-v1', deliveryLane:'backend', candidateType:'implementation', baseSha:base, supersedes:null },
    baseSha:base,
    headSha:head,
    prNumber:7,
    adaptivePolicy,
    integrationPolicy
  };
  const a = compileIntegrationBundle({ ...input, changedPaths:['docs/changes/a.md','tools/a.mjs','brain/learning/a.json','docs/development-ledger-events/a.md'] });
  const b = compileIntegrationBundle({ ...input, changedPaths:['tools/a.mjs','docs/development-ledger-events/a.md','docs/changes/a.md','brain/learning/a.json'] });
  assert.equal(a.bundleHash, b.bundleHash);
});

test('material delta exposes missing closure evidence before writer handoff', () => {
  const closure = compileClosurePlan({ changedPaths:['tools/a.mjs'], policy:integrationPolicy });
  assert.equal(closure.ready, false);
  assert.deepEqual(closure.missing, ['activity_ledger','brain_learning','human_documentation']);
});

test('closure-only learning and docs remain non-material', () => {
  const closure = compileClosurePlan({
    changedPaths:['brain/learning/a.json','docs/changes/a.md','docs/development-ledger-events/a.md'],
    policy:integrationPolicy
  });
  assert.equal(closure.material, false);
  assert.equal(closure.ready, true);
});

test('nested learning path receives adaptive low-risk plan in unified bundle', () => {
  const bundle = compileIntegrationBundle({
    changedPaths:['brain/learning/a.json','docs/changes/a.md','docs/development-ledger-events/a.md'],
    metadata:{ obligationId:'docs-v1', deliveryLane:'docs', candidateType:'docs', baseSha:base, supersedes:null },
    baseSha:base,
    headSha:head,
    adaptivePolicy,
    integrationPolicy
  });
  assert.equal(bundle.adaptive.risk, 'R0');
  assert.equal(bundle.adaptive.fullSharedSuite, false);
});

test('PR contract is compiled from the same immutable candidate scope', () => {
  const contract = compilePrContract({
    metadata:{ obligationId:'contract-v1', deliveryLane:'backend', candidateType:'recovery', baseSha:base, supersedes:99 },
    changedPaths:['b.mjs','a.mjs'],
    maxFiles:2
  });
  assert.deepEqual(contract.lines, [
    'Obligation-ID: contract-v1',
    'Delivery-Lane: backend',
    'Candidate-Type: recovery',
    `Base-SHA: ${base}`,
    'Supersedes: 99',
    'Change-Scope: a.mjs, b.mjs',
    'Scope-Budget: 2'
  ]);
});


test('Required test uses the Integration Bundle as the single preflight compiler', async () => {
  const { readFile } = await import('node:fs/promises');
  const workflow = await readFile('.github/workflows/required-test.yml', 'utf8');
  assert.match(workflow, /id: integration[\s\S]*integration-bundle-compiler\.mjs/);
  assert.match(workflow, /Fail fast on incomplete integration closure/);
  assert.doesNotMatch(workflow, /id: impact\s/);
  assert.match(workflow, /steps\.integration\.outputs\.full_shared_suite/);
});


test('Required test consumes the integration bundle as one derivation authority', async () => {
  const workflow = await readFile('.github/workflows/required-test.yml', 'utf8');
  assert.match(workflow, /id: integration[\s\S]*integration-bundle-compiler\.mjs/);
  assert.match(workflow, /Verify adaptive and integration compiler regressions/);
  assert.match(workflow, /Fail fast on incomplete integration closure/);
  assert.match(workflow, /steps\.integration\.outputs\.full_shared_suite/);
  assert.doesNotMatch(workflow, /id: impact[\s\S]*adaptive-delivery-engine\.mjs/);
});


test('bundle merges bounded historical pattern-memory regressions into adaptive tests', () => {
  const bundle = compileIntegrationBundle({
    changedPaths:['tools/delivery/example.mjs'],
    metadata:{ obligationId:'memory-v1', deliveryLane:'backend', candidateType:'implementation', baseSha:base, supersedes:null },
    baseSha:base,
    headSha:head,
    adaptivePolicy,
    integrationPolicy,
    learningRecords:[{
      fingerprint:'delivery|historical-regression|v1',
      enforcement:['tools/delivery/'],
      test_evidence:['tests/brain-delivery-pattern-memory-v1.test.mjs']
    }]
  });
  assert.ok(bundle.patternMemory.tests.includes('tests/brain-delivery-pattern-memory-v1.test.mjs'));
  assert.ok(bundle.adaptive.tests.includes('tests/brain-delivery-pattern-memory-v1.test.mjs'));
  assert.equal(bundle.patternMemory.matches[0].fingerprint,'delivery|historical-regression|v1');
});
