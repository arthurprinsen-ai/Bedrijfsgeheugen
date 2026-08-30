import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('duplicate remediation ownership is blocked by shared learning', async () => {
  const [preflight, rules, ownership] = await Promise.all([
    readFile('docs/learning/known-error-preflight-contract.md', 'utf8'),
    readFile('config/delivery-prevention-rules.json', 'utf8').then(JSON.parse),
    readFile('brain/learning/remediation-ownership-2026-08-30.json', 'utf8').then(JSON.parse),
  ]);

  assert.match(preflight, /governance\|obligation\|duplicate-remediation-owner/);
  assert.match(preflight, /one root cause gets exactly one canonical remediation owner/i);
  assert.match(preflight, /explicit dependency on the canonical owner/i);

  const lesson = (ownership.lessons || []).find((item) => item.fingerprint === 'governance|obligation|duplicate-remediation-owner');
  assert.ok(lesson, 'missing remediation ownership lesson');
  assert.equal(lesson.preventionRule, 'SINGLE_CANONICAL_REMEDIATION_OWNER_PER_ROOT_CAUSE');

  const rule = (rules.rules || []).find((item) => item.id === 'SINGLE_CANONICAL_REMEDIATION_OWNER_PER_ROOT_CAUSE');
  assert.ok(rule, 'missing single-owner prevention rule');
  assert.equal(rule.active, true);
  assert.equal(rule.scope, 'shared');
});
