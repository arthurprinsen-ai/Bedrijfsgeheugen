import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrationsDir = path.join(root, 'supabase', 'migrations');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'config', 'supabase-production-migration-lineage.json'), 'utf8'));
const migrationFiles = new Set(fs.readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')));

const semanticName = (file) => file.replace(/^\d{14}_/, '');

test('canonical production migration files exist and drifted aliases are absent', () => {
  assert.equal(manifest.contract, 'powerhouse-repo-production-migration-lineage-v1');
  assert.equal(manifest.productionProject, 'adhjwmvyoixzjtmiroln');
  for (const entry of manifest.reconciled) {
    assert.ok(migrationFiles.has(entry.production), `missing exact production migration ${entry.production}`);
    assert.ok(!migrationFiles.has(entry.replacesAlias), `drifted alias must be absent: ${entry.replacesAlias}`);
    assert.equal(semanticName(entry.production), semanticName(entry.replacesAlias), 'reconciliation must only rename the same semantic migration');
  }
});

test('reconciled semantic migrations occur exactly once', () => {
  for (const entry of manifest.reconciled) {
    const semantic = semanticName(entry.production);
    const matches = [...migrationFiles].filter((file) => semanticName(file) === semantic);
    assert.deepEqual(matches, [entry.production], `semantic migration must have one canonical production filename: ${semantic}`);
  }
});

test('lineage closure stays fail closed until post-merge readback', () => {
  assert.equal(manifest.policy.productionLedgerIsAuthority, true);
  assert.equal(manifest.policy.alreadyAppliedDdlMustNotBeReplayed, true);
  assert.equal(manifest.policy.closureRequiresPostMergeProductionAndGithubReadback, true);
  assert.equal(manifest.reconciliationStatus, 'PENDING_MAIN_READBACK');
  assert.equal(manifest.obligation.productionStateBeforeClosure, 'OPEN');
  assert.equal(manifest.obligation.closureState, 'FULFILLED');
});
