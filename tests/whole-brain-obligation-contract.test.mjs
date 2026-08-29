import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const requiredFiles = [
  'docs/outcome-obligations.md',
  'config/outcome-obligations.json',
  'tools/outcome-obligation-validator.mjs',
];

test('whole-brain obligation contract exists and declares the non-silent invariants', async () => {
  for (const path of requiredFiles) await access(path);

  const doc = await readFile('docs/outcome-obligations.md', 'utf8');
  for (const invariant of [
    'NO SILENT FAILURE',
    'NO LOST OBLIGATION',
    'GREEN MEANS OUTCOME VERIFIED',
    'RED MEANS AGENTS KEEP WORKING',
  ]) {
    assert.match(doc, new RegExp(invariant), `missing invariant: ${invariant}`);
  }
});

test('technical success without required outcome evidence is never green', async () => {
  const { evaluateObligation } = await import('../tools/outcome-obligation-validator.mjs');
  const result = evaluateObligation({
    id: 'social-post-2026-08-29-linkedin',
    expected: true,
    technicalSuccess: true,
    dueAt: '2026-08-29T08:40:00+02:00',
    now: '2026-08-29T09:00:00+02:00',
    evidence: [],
  });

  assert.equal(result.status, 'MISSED_OBLIGATION');
  assert.equal(result.green, false);
  assert.equal(result.recoveryRequired, true);
});

test('an expected obligation is green only with outcome evidence', async () => {
  const { evaluateObligation } = await import('../tools/outcome-obligation-validator.mjs');
  const result = evaluateObligation({
    id: 'social-post-2026-08-29-linkedin',
    expected: true,
    technicalSuccess: true,
    dueAt: '2026-08-29T08:40:00+02:00',
    now: '2026-08-29T08:41:00+02:00',
    evidence: [{ type: 'external_post_id', value: 'urn:li:share:123' }],
  });

  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.green, true);
  assert.equal(result.recoveryRequired, false);
});

test('hard boundaries are explicit terminal states, never silent success', async () => {
  const { evaluateObligation } = await import('../tools/outcome-obligation-validator.mjs');
  const result = evaluateObligation({
    id: 'make-runtime-verification',
    expected: true,
    technicalSuccess: false,
    dueAt: '2026-08-29T12:00:00+02:00',
    now: '2026-08-29T13:00:00+02:00',
    evidence: [],
    hardBoundary: 'credentials_or_account_connection',
  });

  assert.equal(result.status, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(result.green, false);
  assert.equal(result.recoveryRequired, false);
});
