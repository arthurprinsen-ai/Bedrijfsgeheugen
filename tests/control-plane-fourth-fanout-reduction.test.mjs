import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const retired = [
  '.github/workflows/business-os-experience.yml',
  '.github/workflows/business-os-foundation.yml',
  '.github/workflows/business-os-trust.yml',
  '.github/workflows/homepage-hero-video-verify.yml',
  '.github/workflows/portal-v2-tests.yml',
];

test('fourth specialist batch no longer fans out directly on pull_request', () => {
  for (const path of retired) {
    const source = readFileSync(path, 'utf8');
    assert.doesNotMatch(source, /^\s{2}pull_request:/m, path);
  }
});

test('Required merge_group preserves fourth-batch assurance', () => {
  const required = readFileSync('.github/workflows/required-test.yml', 'utf8');
  for (const marker of [
    'tests/portal-next-shell.test.mjs',
    'tests/intelligence-agent-runtime.test.mjs',
    'tests/policy-engine.test.mjs',
    'tests/source-adapters.test.mjs',
    'tests/read-models.test.mjs',
    'tests/foundation-registry-eventstore.test.mjs',
    'tests/monitor-brain-ingest.test.mjs',
    '.github/scripts/portal_parity.py',
    'tests/homepage-hero-video.test.mjs',
    'portal-v2',
    'npm test',
    'enhancePortalShell',
  ]) assert.ok(required.includes(marker), marker);
});
