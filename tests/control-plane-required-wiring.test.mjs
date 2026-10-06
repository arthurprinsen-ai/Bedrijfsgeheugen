import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Required enforces both control-plane growth ratchets before heavy work', async () => {
  const source = await readFile('.github/workflows/required-test.yml', 'utf8');
  assert.match(source, /Enforce control-plane growth ratchets/);
  assert.match(source, /node tools\/ci\/check-control-plane-budget\.mjs/);
  assert.match(source, /node tools\/ci\/check-pr-trigger-ratchet\.mjs/);
  const guard = source.indexOf('Enforce control-plane growth ratchets');
  const heavy = source.indexOf('Install runtime dependencies for the unwired contracts');
  assert.ok(guard >= 0 && heavy >= 0 && guard < heavy, 'ratchets must run before heavy shared-suite work');
});

test('delivery hygiene admits a synchronize event when terminal lease already names the exact candidate head', async () => {
  const source = await readFile('.github/workflows/powerhouse-delivery-hygiene.yml', 'utf8');
  assert.match(source, /eventLease\.state === 'TERMINAL_DELIVERY'/);
  assert.match(source, /eventLease\.headSha[\s\S]*!==[\s\S]*headSha/);
  assert.match(source, /TERMINAL_CANDIDATE_MUTATED_WITHOUT_LEASE_TRANSITION/);
});
