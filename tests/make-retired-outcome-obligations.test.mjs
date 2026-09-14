import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const obligations = JSON.parse(
  readFileSync(new URL('../config/outcome-obligations.json', import.meta.url), 'utf8'),
);

test('Make is retired from active outcome-obligation execution', () => {
  assert.ok(obligations.architecture?.retiredPaths?.includes('Make'));
  assert.equal(obligations.architecture?.retiredPathPolicy, 'LEGACY_RETIRED_PATH');
  assert.equal(obligations.rules?.retiredExecutorMayBlockCurrentCompletion, false);

  const activeFields = ['expected', 'evidencePolicy', 'recoveryPolicy'];
  for (const obligation of obligations.registeredObligations ?? []) {
    for (const field of activeFields) {
      const value = String(obligation[field] ?? '');
      assert.doesNotMatch(
        value,
        /\bMake\b|\bBG\d{3}\b/,
        `${obligation.id}.${field} still depends on a retired Make/BG executor`,
      );
    }

    if (obligation.legacyProvenance) {
      assert.match(obligation.legacyProvenance, /LEGACY_RETIRED_PATH/);
    }
  }
});
