import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Obligation: migration-history-lock-controlegroep-20261028
// Production registry (supabase_migrations.schema_migrations) lists these versions;
// the local migration-history lock must list them too.
const expected = [
  ['20261027195341', 'revenue_learning_evidence_timestamp_guard'],
  ['20261028090000', 'bg_experiment_controlegroep_v1'],
  ['20261028230000', 'bg_bedrijfsprofiel_v1'],
];

test('migration-history lock registers the production-applied controlegroep migrations', () => {
  const lock = JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));
  const applied = new Map(lock.applied.map((entry) => [entry.version, entry.name]));
  for (const [version, name] of expected) {
    assert.equal(applied.get(version), name, `lock must list ${version} as ${name}`);
  }
});
