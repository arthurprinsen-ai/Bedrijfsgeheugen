import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Supabase performance measurement is a durable Brain outcome obligation', async () => {
  const contract = JSON.parse(await readFile('config/outcome-obligations.json', 'utf8'));
  const obligation = contract.registeredObligations.find(item => item.id === 'supabase-performance-evidence-daily');

  assert.ok(obligation, 'supabase-performance-evidence-daily must be registered');
  assert.equal(obligation.domain, 'performance');
  assert.equal(obligation.ownerAgent, 'agent-performance');
  assert.equal(obligation.dueAt, 'daily_and_after_relevant_supabase_change');
  assert.match(obligation.evidencePolicy, /two consecutive/i);
  assert.match(obligation.evidencePolicy, /production/i);
  assert.match(obligation.recoveryPolicy, /do not mutate production directly/i);
  assert.match(obligation.idempotencyKey, /finding-key/);
});
