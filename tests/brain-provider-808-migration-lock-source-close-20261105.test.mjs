import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// Execute the existing strict original lock contracts, not an alternative oracle.
import './supabase-migration-history-integrity.test.mjs';
import './brain-original-supabase-800-provider-migration-lock-20261104.test.mjs';

test('provider-applied 808th migration stays in immutable original lock alongside all executable SQL', () => {
  const history = JSON.parse(readFileSync('supabase/migration-history.lock.json','utf8'));
  const expected = '20261105134200_original_data_spine_decision_receipt_same_tick_v1';
  assert.ok(history.applied.some(row => row.version + '_' + row.name === expected), 'original verified provider #808 must remain source-registered');
  const appliedNames = history.applied.map(row => row.version + '_' + row.name + '.sql').sort();
  const sourceNames = readdirSync('supabase/migrations').filter(file => /^\d{14}_.+\.sql$/.test(file)).sort();
  assert.deepEqual(appliedNames,sourceNames,'all provider-registered executable sources must match actual GitHub SQL files');
  assert.equal(new Set(appliedNames).size,appliedNames.length,'no duplicate version/name identity');
  assert.equal(history.project_ref,'adhjwmvyoixzjtmiroln','original provider project only');
});
