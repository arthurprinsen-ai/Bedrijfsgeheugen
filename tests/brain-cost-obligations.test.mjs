import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const REQUIRED_COST_OBLIGATIONS = [
  'cost-policy-10000-monthly',
  'cost-ledger-all-scenarios-daily',
  'brain-budget-writeback',
  'internal-dashboard-authz',
  'internal-dashboard-freshness',
  'production-promotion-dashboard',
];

test('Brain cost controls are registered as durable outcome obligations', async () => {
  const contract = JSON.parse(await readFile('config/outcome-obligations.json', 'utf8'));
  const obligations = new Map((contract.registeredObligations ?? []).map(item => [item.id, item]));

  assert.deepEqual(REQUIRED_COST_OBLIGATIONS.filter(id => obligations.has(id)), REQUIRED_COST_OBLIGATIONS);
  for (const id of REQUIRED_COST_OBLIGATIONS) {
    const obligation = obligations.get(id);
    assert.equal(Boolean(obligation?.domain), true, `${id} has a domain`);
    assert.equal(Boolean(obligation?.expected), true, `${id} has an expected outcome`);
    assert.equal(Boolean(obligation?.dueAt), true, `${id} has a due policy`);
    assert.equal(Boolean(obligation?.ownerAgent), true, `${id} has an owner`);
    assert.equal(Boolean(obligation?.evidencePolicy), true, `${id} has evidence requirements`);
    assert.equal(Boolean(obligation?.idempotencyKey), true, `${id} has an idempotency key`);
    assert.equal(Boolean(obligation?.recoveryPolicy), true, `${id} has recovery behavior`);
  }
});
