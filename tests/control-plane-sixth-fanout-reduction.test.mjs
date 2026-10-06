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
  '.github/workflows/hero-media-production-verify.yml',
  '.github/workflows/engineering-os-learning.yml',
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
    'Verify hero production media contract',
    'Verify engineering learning self-test',
    'tests/brain-powerhouse-engineering-closed-loop.test.mjs',
  ]) assert.ok(required.includes(marker), marker);
});
