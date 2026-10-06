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
