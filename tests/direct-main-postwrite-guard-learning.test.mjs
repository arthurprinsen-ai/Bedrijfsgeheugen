import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('direct-main post-write detection is retained as reusable Brain guard knowledge', async () => {
  const guard = JSON.parse(await readFile('config/direct-main-postwrite-governance-guard.json', 'utf8'));
  assert.equal(guard.failClosed, true);
  const failures = new Map(guard.knownFailures.map((item) => [item.fingerprint, item]));

  for (const fingerprint of [
    'github|main-governance|post-push-ci-after-unauthorized-write',
    'github|main-governance|unprotected-main-direct-write-requires-recovery'
  ]) {
    const failure = failures.get(fingerprint);
    assert.ok(failure, `missing Brain guard fingerprint ${fingerprint}`);
    assert.equal(failure.status, 'PROVEN');
    assert.equal(failure.preventionRule, 'POST_PUSH_CI_IS_DETECTION_NOT_PREVENTION');
    assert.equal(failure.regressionContract, 'tests/direct-main-postwrite-guard-learning.test.mjs');
    assert.ok(failure.rootCause.length > 20);
    assert.ok(failure.fix.length > 20);
  }

  const rules = JSON.parse(await readFile('config/delivery-prevention-rules.json', 'utf8'));
  const rule = rules.rules.find((item) => item.id === 'POST_PUSH_CI_IS_DETECTION_NOT_PREVENTION');
  assert.equal(rule?.active, true);
});
