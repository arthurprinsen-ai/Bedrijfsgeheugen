import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('duplicate remediation ownership is blocked by shared learning', async () => {
  const [preflight, rules] = await Promise.all([
    readFile('docs/learning/known-error-preflight-contract.md', 'utf8'),
    readFile('config/delivery-prevention-rules.json', 'utf8').then(JSON.parse),
  ]);

  assert.match(preflight, /governance\|obligation\|duplicate-remediation-owner/);
  assert.match(preflight, /one root cause gets exactly one canonical remediation owner/i);
  assert.match(preflight, /explicit dependency on the canonical owner/i);

  const rule = (rules.rules || []).find((item) => item.id === 'SINGLE_CANONICAL_REMEDIATION_OWNER_PER_ROOT_CAUSE');
  assert.ok(rule, 'missing single-owner prevention rule');
  assert.equal(rule.active, true);
  assert.equal(rule.scope, 'shared');
});
