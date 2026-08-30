import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

test('repository delivery ledger has an active prevention for every PROVEN lesson', async () => {
  const decision = await loadDeliveryPreflight({ component: 'shared' });
  assert.equal(decision.ok, true);
  assert.ok(decision.reusedLessons.length >= 1);
});

test('preflight fails closed when a PROVEN lesson is missing from active prevention registry', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'delivery-preflight-'));
  const lessonsPath = join(dir, 'lessons.json');
  const rulesPath = join(dir, 'rules.json');
  await writeFile(lessonsPath, JSON.stringify({ lessons: [{ fingerprint: 'x', stage: 'MERGE', component: 'shared', preventionRule: 'MISSING_RULE', status: 'PROVEN' }] }));
  await writeFile(rulesPath, JSON.stringify({ rules: [] }));
  await assert.rejects(() => loadDeliveryPreflight({ lessonsPath, rulesPath }), /MISSING_RULE/);
});
