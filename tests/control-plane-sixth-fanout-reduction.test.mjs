import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const retired = [
  '.github/workflows/ai-model-intelligence.yml',
  '.github/workflows/autonomous-improvement-completion-gate.yml',
  '.github/workflows/buffer-social-learning.yml',
  '.github/workflows/config-wacht.yml',
  '.github/workflows/portal-parity.yml',
  '.github/workflows/repository-hygiene.yml',
  '.github/workflows/regelgeving-actueel.yml',
  '.github/workflows/chat-learning-preflight-pr.yml',
  '.github/workflows/business-os-intelligence.yml',
  '.github/workflows/hero-media-production-verify.yml',
  '.github/workflows/engineering-os-learning.yml',
  '.github/workflows/revenue-content-intelligence.yml',
  '.github/workflows/revenue-learning.yml',
  '.github/workflows/seo-growth-intelligence.yml',
  '.github/workflows/seo-order-engine.yml',
  '.github/workflows/unified-content-operations.yml',
  '.github/workflows/universal-closed-loop-learning.yml',
  '.github/workflows/blog-technical-seo-gate.yml',
  '.github/workflows/paginacontrole-debug.yml',
  '.github/workflows/portal-visual-density.yml',
  '.github/workflows/powerhouse-quality-surface-gate.yml',
  '.github/workflows/fresh-device-autonomy-canary.yml',
  '.github/workflows/verify-approved-central-blog.yml',
  '.github/workflows/powerhouse-assurance.yml',
  '.github/workflows/powerhouse-foresight-autonomy.yml',
  '.github/workflows/component-preview.yml',
  '.github/workflows/powerhouse-closure-a-f.yml',
  '.github/workflows/powerhouse-daily-self-evolution.yml',
  '.github/workflows/powerhouse-autonomous-engineering-optimizer.yml',
  '.github/workflows/powerhouse-security-operations-closure.yml',
  '.github/workflows/powerhouse-supabase-security-contract.yml',
  '.github/workflows/security-operations-proof.yml',
  '.github/workflows/repo-writer-parity-rollback.yml',
  '.github/workflows/repo-writer-cheap-canary.yml',
  '.github/workflows/portal-v2-production-dom-readback.yml',
  '.github/workflows/portal-v2-live-preview.yml',
  '.github/workflows/repo-writer-operational-verification.yml',
  '.github/workflows/engineering-supply-chain-trust.yml',
];

test('sixth specialist batch no longer fans out directly on pull_request', () => {
  for (const path of retired) {
    const source = readFileSync(path, 'utf8');
    assert.doesNotMatch(source, /^\s{2}pull_request:/m, path);
  }
});

test('Required merge_group preserves sixth-batch assurance', () => {
  const required = readFileSync('.github/workflows/required-test.yml', 'utf8');
  for (const marker of [
    'tests/ai-model-advisor-v1.test.mjs',
    'tests/brain-autonomous-improvement-runtime-completion.test.mjs',
    'tests/brain-autonomous-improvement-recovery-proof.test.mjs',
    'tests/social-learning-buffer-collector.test.mjs',
    'tools/config-wacht.py',
    'tests/portal-parity-source-contract.py',
    'tests/portal-modular-legacy-capability-parity.test.mjs',
    'tests/brain-repository-hygiene.test.mjs',
    'tests/brain-acceptance.test.mjs',
    'tests/agent-fabric.test.mjs',
    'tests/brain-autonomous-improvement-production-cycle.test.mjs',
    'tests/delivery-regelgeving-actueel.test.mjs',
    'tests/brain-chat-learning-fast-development-v2.test.mjs',
    'Run intelligence, chat and regulation merge assurance',
    'Verify hero production media contract',
    'Verify engineering learning self-test',
    'tests/brain-powerhouse-engineering-closed-loop.test.mjs',
    'tests/revenue-content-intelligence.test.mjs',
    'tests/revenue-learning-*.test.mjs',
    'tests/seo-locale-revenue-*.test.mjs',
    'tests/content-growth-unified-content-operations.test.mjs',
    'scripts/brain/validate-universal-closed-loop-learning.mjs',
    'tests/brain-universal-closed-loop-learning.test.mjs',
    'tests/approved-blog-verifier-contract.test.mjs',
    'tests/powerhouse-assurance.test.mjs',
    'scripts/powerhouse-assurance-check.mjs',
    'scripts/brain/powerhouse-loop-assurance-contract.mjs',
    'scripts/brain/powerhouse-quality-intelligence.mjs',
    'tests/powerhouse-foresight-autonomy.test.mjs',
    'tests/brain-powerhouse-foresight-prediction-intelligence-v2.test.mjs',
    'scripts/brain/foresight-autonomy.mjs',
    'tests/components/*.test.mjs',
    'tests/brain-powerhouse-closure-a-f.test.mjs',
    'tests/powerhouse-daily-self-evolution.test.mjs',
    'tests/brain-self-improvement-layer-v1.test.mjs',
    'tests/ai-model-intelligence-freshness-v1.test.mjs',
    'tests/brain-autonomous-engineering-fabric-v3.test.mjs',
    'tests/brain-security-operations-closure-v1.test.mjs',
    'tests/security-operations-proof.test.mjs',
    'scripts/security-operations-proof.mjs --check',
    'scripts/brain/check_powerhouse_supabase_security.py',
    'tests/candidate-environment.test.mjs',
    'Verify dependency supply-chain risk',
  ]) assert.ok(required.includes(marker), marker);
});


test('heavy read-only specialists moved from pull_request to merge_group', () => {
  for (const path of [
    '.github/workflows/blog-technical-seo-gate.yml',
    '.github/workflows/paginacontrole-debug.yml',
    '.github/workflows/portal-visual-density.yml',
    '.github/workflows/powerhouse-quality-surface-gate.yml',
    '.github/workflows/fresh-device-autonomy-canary.yml',
  ]) {
    const source = readFileSync(path, 'utf8');
    assert.match(source, /^  merge_group:/m, path);
    assert.doesNotMatch(source, /^  pull_request:/m, path);
  }
});


test('retired duplicate Business OS workflow is removed and Supabase contract is reusable-only', () => {
  assert.throws(() => readFileSync('.github/workflows/business-os-live-preview.yml', 'utf8'));
  const supabase = readFileSync('.github/workflows/supabase-pr-preview.yml', 'utf8');
  assert.match(supabase, /^  workflow_call:/m);
  assert.doesNotMatch(supabase, /^  pull_request:/m);
});

test('portal preview preserves consolidated Business OS evidence after Required admission', () => {
  const source = readFileSync('.github/workflows/portal-v2-live-preview.yml', 'utf8');
  assert.match(source, /^  workflow_run:/m);
  assert.match(source, /workflows:\s*\['Required test'\]/);
  assert.doesNotMatch(source, /^  pull_request:/m);
  assert.ok(source.includes("Verify canonical Business OS redirect and input compatibility"));
  assert.ok(source.includes("readLegacyPortalBusinessInputs"));
});


test('writer PR fan-out is consolidated behind one operational router', () => {
  const router = readFileSync('.github/workflows/repo-writer-operational-verification.yml', 'utf8');
  const cheap = readFileSync('.github/workflows/repo-writer-cheap-canary.yml', 'utf8');
  const parity = readFileSync('.github/workflows/repo-writer-parity-rollback.yml', 'utf8');
  const shadow = readFileSync('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  assert.doesNotMatch(router, /^  pull_request:/m);
  assert.match(router, /^  workflow_run:/m);
  assert.match(router, /workflows:\s*\['Required test'\]/);
  assert.ok(router.includes('route-cheap-canary:'));
  assert.ok(router.includes('route-parity-rollback:'));
  assert.ok(router.includes('gh workflow run repo-writer-cheap-canary.yml'));
  assert.ok(router.includes('gh workflow run repo-writer-parity-rollback.yml'));
  assert.doesNotMatch(cheap, /^  pull_request:/m);
  assert.match(cheap, /^  workflow_dispatch:/m);
  assert.doesNotMatch(parity, /^  pull_request:/m);
  assert.match(parity, /^  workflow_dispatch:/m);
  assert.doesNotMatch(shadow, /^  pull_request:/m);
});


test('Portal evidence is post-admission while production push readback remains independent', () => {
  const preview = readFileSync('.github/workflows/portal-v2-live-preview.yml', 'utf8');
  const production = readFileSync('.github/workflows/portal-v2-production-dom-readback.yml', 'utf8');
  assert.match(preview, /^  workflow_run:/m);
  assert.doesNotMatch(preview, /^  pull_request:/m);
  assert.ok(preview.includes('Verify production DOM suite on immutable PR deploy'));
  assert.ok(preview.includes('visual-baseline-pr-${{ github.event.workflow_run.pull_requests[0].number }}-${{ github.event.workflow_run.pull_requests[0].head.sha }}'));
  assert.ok(preview.includes('run-name: portal-preview-pr-'));
  assert.doesNotMatch(production, /^  pull_request:/m);
  assert.match(production, /^  push:/m);
  assert.ok(production.includes('portal-v2-live-preview.yml/runs?event=workflow_run'));
  assert.ok(production.includes('expected_title="portal-preview-pr-${pr_number}-${pr_head_sha}"'));
});

test('Powerhouse CodeQL is the single PR CodeQL authority for JS/TS and Python', () => {
  assert.throws(() => readFileSync('.github/workflows/codeql.yml', 'utf8'));
  const source = readFileSync('.github/workflows/powerhouse-codeql.yml', 'utf8');
  assert.match(source, /^  pull_request:/m);
  assert.ok(source.includes('run_js:'));
  assert.ok(source.includes('run_python:'));
  assert.ok(source.includes('languages: javascript-typescript'));
  assert.ok(source.includes('languages: python'));
  assert.ok(source.includes("category: '/language:python'"));
});


test('consolidated CodeQL workflow has one scope and one job per language', () => {
  const source = readFileSync('.github/workflows/powerhouse-codeql.yml', 'utf8');
  assert.equal((source.match(/^  scope:/gm) || []).length, 1);
  assert.equal((source.match(/^  analyze:/gm) || []).length, 1);
  assert.equal((source.match(/^  analyze_python:/gm) || []).length, 1);
  assert.ok(source.includes("if: needs.scope.outputs.run_js == 'true'"));
  assert.ok(source.includes("if: needs.scope.outputs.run_python == 'true'"));
});

test('PR admission baseline is exactly Required plus Powerhouse CodeQL', () => {
  const baseline = JSON.parse(readFileSync('config/pr-trigger-baseline.json', 'utf8'));
  assert.equal(baseline.admissionPullRequestWorkflowCount, 2);
  assert.equal(baseline.directPullRequestWorkflowCount, 7);
  assert.deepEqual([...baseline.admissionPullRequestWorkflows].sort(), ['powerhouse-codeql.yml','required-test.yml']);
});
