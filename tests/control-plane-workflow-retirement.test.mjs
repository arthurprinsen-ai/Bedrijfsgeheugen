import test from 'node:test';
import assert from 'node:assert/strict';
import { assessWorkflowRetirement } from '../tools/ci/assess-workflow-retirement.mjs';

test('marks a test-only PR workflow safe when canonical gate already covers every test', () => {
  const candidate = `on:\n  pull_request:\njobs:\n  t:\n    steps:\n      - run: node --test tests/a.test.mjs tests/b.test.mjs\n`;
  const canonical = `steps:\n  - run: node --test tests/a.test.mjs tests/b.test.mjs tests/c.test.mjs\n`;
  const result = assessWorkflowRetirement({ candidateSource: candidate, canonicalSources: [canonical] });
  assert.equal(result.safeToRemoveDirectPrTrigger, true);
  assert.deepEqual(result.missingTests, []);
});

test('blocks retirement when provider mutation exists', () => {
  const candidate = `on:\n  pull_request:\njobs:\n  t:\n    steps:\n      - run: netlify deploy --prod\n`;
  const result = assessWorkflowRetirement({ candidateSource: candidate, canonicalSources: ['steps: []'] });
  assert.equal(result.safeToRemoveDirectPrTrigger, false);
  assert.ok(result.blockers.includes('provider-mutation'));
});

test('blocks retirement when candidate tests are not covered canonically', () => {
  const candidate = `on:\n  pull_request:\njobs:\n  t:\n    steps:\n      - run: node --test tests/only-here.test.mjs\n`;
  const result = assessWorkflowRetirement({ candidateSource: candidate, canonicalSources: ['steps: []'] });
  assert.equal(result.safeToRemoveDirectPrTrigger, false);
  assert.deepEqual(result.missingTests, ['tests/only-here.test.mjs']);
});
